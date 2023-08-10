import { type EndpointDefinitions } from "@reduxjs/toolkit/query/react";
import { type AnyRouter } from "@trpc/server";
import { isPlainObject, isString } from "is-what";

import { createTRPCBaseQuery } from "./create-trpc-base-query";
import { AnyApi } from "./rtk-types";
import { type TRPCClientOptions } from "./trpc-client-options";

/**
 * For decapitalizing endpoint name parts
 * @internal
 **/
export const deCapitalize = (string_: string) => {
  const firstChar = string_[0];
  return firstChar ? string_.replace(firstChar, firstChar?.toLowerCase()) : string_;
};

/**
 * Helper wrapper for is-what's isString that can be used as assertion.
 * Assertions can't be declared with arrow functions, so we need to use function.
 * @internal
 **/
export function assertIsString(property: unknown): asserts property is string {
  if (!isString(property)) {
    throw new TypeError("Calling api with non string properties is not supported");
  }
}

/**
 * Generic type for api that has injectEndpoint method for run time injection.
 * @internal
 **/
export type Injectable = Pick<AnyApi, "injectEndpoints">;

/**
 * Options for endpoints (https://redux-toolkit.js.org/rtk-query/api/createApi#anatomy-of-an-endpoint) that users are allowed to pass. Some options are disabled since they're generated.
 * @internal
 */
export type DisabledEndpointOptions =
  | "extraOptions" // TODO: https://github.com/otahontas/trpc-rtk-query/issues/38
  | "query" // query is not allowed to be passed in as it's generated
  | "queryFn" // queryFn is not allowed to be passed in as it's generated
  | "transformErrorResponse" // TODO: https://github.com/otahontas/trpc-rtk-query/issues/38
  | "transformResponse" // TODO: https://github.com/otahontas/trpc-rtk-query/issues/38
  | "type"; // type is a typescript only internal type for rtk, not needed here.

/**
 * Generic type to match against endpoint options that users are allowed to pass.
 * @internal
 */
type AnyEndpointOptions = {
  [K in keyof EndpointDefinitions]?: Omit<
    EndpointDefinitions[K],
    DisabledEndpointOptions
  >;
};

/**
 * Options to decide whether to use queryFn or baseQuery. If using queryFn,
 * client options must be provided.
 * @internal
 */
type QueryOptions<TRouter extends AnyRouter> =
  | {
      endpointOptions?: AnyEndpointOptions | undefined;
      tRPCClientOptions: TRPCClientOptions<TRouter>;
      useQueryFunction: true;
    }
  | {
      endpointOptions?: AnyEndpointOptions | undefined;
      tRPCClientOptions?: never;
      useQueryFunction: false;
    };

/**
 * Used for run time injection of endpoints to api. Formats rtk endpoint to trpc
 * procedure path, resolved which query style to use and injects the result to api
 * object.
 * @internal
 */
const injectEndpointToApi = <Api extends Injectable, TRouter extends AnyRouter>(
  options: {
    api: Api;
    endpoint: string;
    procedureType: "mutation" | "query";
  } & QueryOptions<TRouter>,
) => {
  const { api, endpoint, endpointOptions, procedureType, useQueryFunction } = options;
  const procedurePath = endpoint.includes("_")
    ? endpoint
        .split("_")
        .map((part) => deCapitalize(part))
        .join(".")
    : endpoint;

  const builderArguments = useQueryFunction
    ? {
        // TODO: https://github.com/otahontas/trpc-rtk-query/issues/41
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        queryFn: (procedureArguments: unknown, api: any, extraOptions: any) =>
          // eslint-disable-next-line unicorn/consistent-destructuring
          createTRPCBaseQuery(options.tRPCClientOptions)(
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

  api.injectEndpoints({
    endpoints: (builder) => ({
      [endpoint]: builder[procedureType]({
        ...builderArguments,
        ...(endpointOptions?.[endpoint] as EndpointDefinitions), // TODO: https://github.com/otahontas/trpc-rtk-query/issues/47
      }),
    }),
  });
};

/**
 * Helper function that creates proxy which validates incoming properties on each level
 * before calling callback on final level. Defaults to empty object if target is
 * not available.
 * @internal
 **/
export const createRecursiveProtectiveProxy = ({
  callback,
  propertyList = [],
  proxyTarget,
  recursionLevels,
}: {
  callback: (handledProperties: string[]) => unknown;
  propertyList?: string[];
  proxyTarget: object;
  recursionLevels: number;
}): unknown =>
  new Proxy(proxyTarget, {
    get(target, property, receiver) {
      if (Reflect.has(target, property)) {
        return Reflect.get(target, property, receiver);
      }
      assertIsString(property);
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

/**
 * Regexes for matching procedure types
 * @internal
 **/
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

/**
 * Takes in api object and wraps it to proxy that listens for calls to different
 * methods. If method needs an endpoint, it is generated and injected to api object.
 * @internal
 */
export const wrapApiToProxy = <Api extends Injectable, TRouter extends AnyRouter>({
  api: nonProxyApi,
  ...queryOptions // grab rest, so it's easier to pass them forwards
}: {
  api: Api;
} & QueryOptions<TRouter>) =>
  new Proxy(nonProxyApi, {
    get(target, property, receiver) {
      // Validate endpoints target, since it is needed in multiple places
      if (!("endpoints" in target) || !isPlainObject(target["endpoints"])) {
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
            injectEndpointToApi({
              api: target,
              endpoint,
              procedureType,
              ...queryOptions,
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
            injectEndpointToApi({
              api: target,
              endpoint,
              procedureType: "query",
              ...queryOptions,
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
      assertIsString(property);

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
        injectEndpointToApi({
          api: target,
          endpoint,
          procedureType,
          ...queryOptions,
        });

        // Return newly generated property
        return target[property as keyof typeof target];
      }

      throw new TypeError(
        `Property ${property} is not defined and could not be generated`,
      );
    },
  });
