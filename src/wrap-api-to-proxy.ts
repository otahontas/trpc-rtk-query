// TODO: don't import from dist
import { type CoreModule } from "@reduxjs/toolkit/dist/query/core/module";
import { type ReactHooksModule } from "@reduxjs/toolkit/dist/query/react/module";
import { type Api } from "@reduxjs/toolkit/query/react";
import { type AnyRouter } from "@trpc/server";

import { createBaseQueryForTRPCClient } from "./create-base-query";
import { type CreateTRPCApiClientOptions } from "./create-trpc-api-client-options";
export type SupportedModule = CoreModule | ReactHooksModule;

// Helpers
export const deCapitalize = (string_: string) => {
  const firstChar = string_[0];
  return firstChar ? string_.replace(firstChar, firstChar?.toLowerCase()) : string_;
};

export const isObject = (value: unknown): value is Record<PropertyKey, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isString = (value: unknown): value is string => typeof value === "string";

// assertions can't be declared with arrow functions, so we need to use function
export function assertPropertyIsString(
  property: string | symbol,
): asserts property is string {
  if (typeof property === "symbol") {
    throw new TypeError("Calling api with new symbol properties is not supported");
  }
}

export type Injectable = Pick<
  // Pick the fields we need to inject trpc endpoints properly on type level
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Api<any, Record<string, any>, any, any, SupportedModule>,
  "endpoints" | "injectEndpoints"
>;

type FormatEndpointToProcedurePathAndInjectToApiOptions<
  ProxyedApi extends Injectable,
  TRouter extends AnyRouter,
> = {
  endpoint: string;
  procedureType: "mutation" | "query";
  proxyedApi: ProxyedApi;
} & (
  | {
      createTrpcApiClientOptions: CreateTRPCApiClientOptions<TRouter>;
      useQueryFunction: true;
    }
  | {
      useQueryFunction: false;
    }
);

const formatEndpointToProcedurePathAndInjectToApi = <
  ProxyedApi extends Injectable,
  TRouter extends AnyRouter,
>(
  options: FormatEndpointToProcedurePathAndInjectToApiOptions<ProxyedApi, TRouter>,
) => {
  const { endpoint, procedureType, proxyedApi, useQueryFunction } = options;
  const procedurePath = endpoint.includes("_")
    ? endpoint
        .split("_")
        .map((part) => deCapitalize(part))
        .join(".")
    : endpoint;

  const builderArguments = useQueryFunction
    ? {
        // TODO: fix typings, e.g. injectable api. extraOptions etc.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        queryFn: (procedureArguments: unknown, api: any, extraOptions: any) =>
          // eslint-disable-next-line unicorn/consistent-destructuring
          createBaseQueryForTRPCClient(options.createTrpcApiClientOptions)(
            {
              procedureArguments,
              procedurePath,
              procedureType,
            },
            api,
            extraOptions,
          ),
      }
    : {
        query: (procedureArguments: unknown) => ({
          procedureArguments,
          procedurePath,
          procedureType,
        }),
      };

  proxyedApi.injectEndpoints({
    endpoints: (builder) => ({
      [endpoint]: builder[procedureType](builderArguments),
    }),
  });
};

// Helper function that creates proxy which validates incoming properties on each level
// before calling callback on final level. Defaults to empty object if target is not available
type CreateRecursiveProtectiveProxyOptions = {
  callback: (handledProperties: string[]) => unknown;
  propertyList?: string[];
  proxyTarget: object;
  recursionLevels: number;
};

export const createRecursiveProtectiveProxy = ({
  callback,
  propertyList = [],
  proxyTarget,
  recursionLevels,
}: CreateRecursiveProtectiveProxyOptions): unknown =>
  new Proxy(proxyTarget, {
    get(target, property, receiver) {
      if (Reflect.has(target, property)) {
        return Reflect.get(target, property, receiver);
      }
      assertPropertyIsString(property);
      const newPropertyList = [...propertyList, property];
      return recursionLevels > 1
        ? createRecursiveProtectiveProxy({
            callback,
            propertyList: newPropertyList,
            proxyTarget: {}, // there's no property so pass in empty oject
            recursionLevels: recursionLevels - 1,
          })
        : callback(newPropertyList); // callback handles the leaf property
    },
  });

const regexesWithProcedureType = [
  {
    procedureType: "query",
    regex: /use(\w+)Query/,
  },
  {
    procedureType: "query",
    regex: /useLazy(\w+)Query/,
  },
  {
    procedureType: "mutation",
    regex: /use(\w+)Mutation/,
  },
] as const;

export const wrapApiToProxy = <
  NonProxyApi extends Injectable,
  TRouter extends AnyRouter,
>({
  nonProxyApi,
  ...queryFunctionProperties
}: {
  nonProxyApi: NonProxyApi;
} & (
  | {
      createTrpcApiClientOptions: CreateTRPCApiClientOptions<TRouter>;
      useQueryFunction: true;
    }
  | {
      useQueryFunction: false;
    }
)) =>
  new Proxy(nonProxyApi, {
    get(target, property, receiver) {
      // Validate endpoints target, since it is needed in multiple places
      if (!("endpoints" in target) || !isObject(target["endpoints"])) {
        throw new Error("Library error: Can't get endpoints from rtk api!");
      }
      const { endpoints } = target;
      // If property is "endpoints", we know that it surely exists, but
      // user might want to call endpoint attribute of it that isn't yet generated.
      // Return proxy that handles generating.
      if (property === "endpoints") {
        // Return two level proxy, where last level can actually inject the endpoint.
        return createRecursiveProtectiveProxy({
          callback: (propertyList) => {
            const [endpoint, operation] = propertyList;
            if (!endpoint || !operation) {
              throw new Error(
                "Library error: Internal recursive proxy failed to collect all properties!",
              );
            }
            const mutationOperation = "useMutation";
            const queryOperations = [
              "useQuery",
              "useQueryState",
              "useQuerySubscription",
              "useLazyQuery",
              "useLazyQuerySubscription",
            ];
            let procedureType: "mutation" | "query" | undefined;
            if (operation === mutationOperation) {
              procedureType = "mutation" as const;
            } else if (queryOperations.includes(operation)) {
              procedureType = "query" as const;
            } else {
              throw new Error(
                `Input error: Property ${property}.${endpoint}.${operation} is not defined and could not be generated`,
              );
            }
            formatEndpointToProcedurePathAndInjectToApi({
              endpoint,
              procedureType,
              proxyedApi: target,
              ...queryFunctionProperties,
            });
            // Any is ok, we know endpoint will have this endpoint
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return (endpoints as any)[endpoint][operation];
          },
          proxyTarget: target["endpoints"],
          recursionLevels: 2,
        });
      }

      // if property is usePrefetch we need to wrap it with it's arguments, so
      // we can inject endpoint if needed
      if (property === "usePrefetch") {
        return (...usePrefetchArguments: unknown[]) => {
          const [endpoint] = usePrefetchArguments; // endpoint that should be in endpoints record
          if (!isString(endpoint)) {
            throw new Error(
              "input error: usePrefetch must be called with endpoint name string as first arg",
            );
          }
          if (!endpoints[endpoint]) {
            formatEndpointToProcedurePathAndInjectToApi({
              endpoint,
              procedureType: "query",
              proxyedApi: target,
              ...queryFunctionProperties,
            });
          }
          // any is okay, we know usePrefetch hook is at least now generated
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return (target as any)["usePrefetch"](...usePrefetchArguments);
        };
      }

      // Generate the endpoint
      if (Reflect.has(target, property)) {
        return Reflect.get(target, property, receiver);
      }
      assertPropertyIsString(property);

      for (const { procedureType, regex } of regexesWithProcedureType) {
        const match = regex.exec(property);
        if (!match) {
          continue;
        }
        // matched group is the 2nd arg
        const capitalizedEndpoint = match[1];
        // pass through if parsing not okay with this regex
        if (!capitalizedEndpoint) {
          continue;
        }
        const endpoint = deCapitalize(capitalizedEndpoint);
        // check if it is actually deeper path for trpc, handle replacements correctly
        formatEndpointToProcedurePathAndInjectToApi({
          endpoint,
          procedureType,
          proxyedApi: target,
          ...queryFunctionProperties,
        });

        // Return newly generated property
        return target[property as keyof typeof target];
      }

      throw new TypeError(
        `Property ${property} is not defined and could not be generated`,
      );
    },
  });
