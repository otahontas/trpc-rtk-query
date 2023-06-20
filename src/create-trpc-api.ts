import { type CoreModule } from "@reduxjs/toolkit/dist/query/core/module";
import { type ReactHooksModule } from "@reduxjs/toolkit/dist/query/react/module";
import { type Api, createApi } from "@reduxjs/toolkit/query/react";
import { type AnyRouter } from "@trpc/server";
import { isAnyObject, isString } from "is-what";

import {
  type BaseQueryForTRPCClient,
  type CreateTRPCApiClientOptions,
  createBaseQueryForTRPCClient,
} from "./create-base-query";
import { type CreateEndpointDefinitionsFromTRPCRouter } from "./create-endpoint-definitions";

const deCapitalize = (string_: string) => {
  const firstChar = string_[0];
  return firstChar ? string_.replace(firstChar, firstChar?.toLowerCase()) : string_;
};

type FormatEndpointToProcedurePathAndInjectToApiOptionsBase<
  ProxyedApi extends Injectable,
> = {
  endpoint: string;
  procedureType: "mutation" | "query";
  proxyedApi: ProxyedApi;
};
type FormatEndpointToProcedurePathAndInjectToApiOptionWithoutQueryFunction<
  ProxyedApi extends Injectable,
> = FormatEndpointToProcedurePathAndInjectToApiOptionsBase<ProxyedApi> & {
  useQueryFunction: false;
};
type FormatEndpointToProcedurePathAndInjectToApiOptionWithQueryFunction<
  ProxyedApi extends Injectable,
  TRouter extends AnyRouter,
> = FormatEndpointToProcedurePathAndInjectToApiOptionsBase<ProxyedApi> & {
  createTrpcApiClientOptions: CreateTRPCApiClientOptions<TRouter>;
  useQueryFunction: true;
};

type FormatEndpointToProcedurePathAndInjectToApiOptions<
  ProxyedApi extends Injectable,
  TRouter extends AnyRouter,
> =
  | FormatEndpointToProcedurePathAndInjectToApiOptionWithQueryFunction<
      ProxyedApi,
      TRouter
    >
  | FormatEndpointToProcedurePathAndInjectToApiOptionWithoutQueryFunction<ProxyedApi>;

// Note that assertions can't be declared with arrow functions. Otherwise we're
// following arrow function style here.
function assertPropertyIsString(property: string | symbol): asserts property is string {
  if (typeof property === "symbol") {
    throw new TypeError("Calling api with new symbol properties is not supported");
  }
}

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
        // TODO: fix typings
        // TODO: curry, so we don't have to pass all three args. And can we use
        // createBaseQuery, should we have createBaseFn instead?
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
const createRecursiveProtectiveProxy = ({
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

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Injectable = Pick<
  // Any is okay, we just need this to check that proxyedApi is correctly shaped
  // and that we have correct params for baseQuery
  Api<any, Record<string, any>, any, any, CoreModule | ReactHooksModule>,
  "injectEndpoints"
>;

type InferBaseQuery<ExistingApi extends Injectable> = ExistingApi extends Api<
  infer BaseQuery,
  Record<string, any>,
  any,
  any,
  CoreModule | ReactHooksModule
>
  ? BaseQuery
  : never;

type InferEndpoints<ExistingApi extends Injectable> = ExistingApi extends Api<
  any,
  infer Endpoints,
  any,
  any,
  CoreModule | ReactHooksModule
>
  ? Endpoints
  : never;

type InferReducerPath<ExistingApi extends Injectable> = ExistingApi extends Api<
  any,
  Record<string, any>,
  infer ReducerPath,
  any,
  CoreModule | ReactHooksModule
>
  ? ReducerPath
  : never;

type InferTagTypes<ExistingApi extends Injectable> = ExistingApi extends Api<
  any,
  Record<string, any>,
  any,
  infer TagTypes,
  CoreModule | ReactHooksModule
>
  ? TagTypes
  : never;
/* eslint-disable @typescript-eslint/no-explicit-any */

export type CreateTRPCApiOptions<
  TRouter extends AnyRouter,
  ExistingApi extends Injectable = never,
> = CreateTRPCApiClientOptions<TRouter> & {
  api?: ExistingApi | undefined;
};

export type AnyCreateTRPCApiOptions = CreateTRPCApiOptions<AnyRouter, never>;

type CreateTRPCApi<
  TRouter extends AnyRouter,
  ExistingApi extends Injectable,
  Options extends { api?: ExistingApi | undefined },
> = Options["api"] extends undefined
  ? Api<
      BaseQueryForTRPCClient,
      CreateEndpointDefinitionsFromTRPCRouter<
        TRouter,
        BaseQueryForTRPCClient,
        never, // TODO pass in different order...
        "api" // TODO
      >,
      "api", // TODO
      never,
      CoreModule | ReactHooksModule
    >
  : Api<
      InferBaseQuery<ExistingApi>,
      InferEndpoints<ExistingApi> &
        CreateEndpointDefinitionsFromTRPCRouter<
          TRouter,
          InferBaseQuery<ExistingApi>,
          InferTagTypes<ExistingApi>,
          InferReducerPath<ExistingApi>
        >,
      InferReducerPath<ExistingApi>,
      InferTagTypes<ExistingApi>,
      CoreModule | ReactHooksModule
    >;

// TODO: infer types correctly when passing in premade client or when getting client
export const createTRPCApi = <
  TRouter extends AnyRouter,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ExistingApi extends Injectable = never,
>(
  options: CreateTRPCApiOptions<TRouter, ExistingApi>,
): CreateTRPCApi<TRouter, ExistingApi, typeof options> => {
  const { api: existingApi } = options;
  const nonProxyApi = existingApi
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (existingApi as unknown as Api<
        InferBaseQuery<ExistingApi>,
        CreateEndpointDefinitionsFromTRPCRouter<
          TRouter,
          InferBaseQuery<ExistingApi>,
          InferTagTypes<ExistingApi>,
          InferReducerPath<ExistingApi>
        >,
        InferReducerPath<ExistingApi>,
        InferTagTypes<ExistingApi>
      >)
    : createApi<
        BaseQueryForTRPCClient,
        CreateEndpointDefinitionsFromTRPCRouter<
          TRouter,
          BaseQueryForTRPCClient,
          never,
          "api" // Reducer path. TODO: see if we can default to rtk querys default, so we don't redo this one
        >,
        "api", // recuder path
        never
      >({
        baseQuery: createBaseQueryForTRPCClient(options),
        // We're injecting endpoints later with proxy, so this can be any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        endpoints: () => ({} as any),
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

  const useQueryFunctionOptions = existingApi
    ? {
        createTrpcApiClientOptions: options,
        useQueryFunction: true as const,
      }
    : {
        useQueryFunction: false as const,
      };

  return new Proxy(nonProxyApi, {
    get(target, property, receiver) {
      // Validate endpoints target, since it is needed in multiple places
      if (!("endpoints" in target) || !isAnyObject(target["endpoints"])) {
        throw new Error("Library error: Can't get endpoints from rtk api!");
      }
      const { endpoints } = target;
      // If property is "endpoints", we know that it surely exists, but
      // user might want to call endpoint attribute of it  that isn't yet generated.
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
              ...useQueryFunctionOptions,
            });
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return endpoints[endpoint]![operation]; // TODO: check why this doesn't work
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
              ...useQueryFunctionOptions,
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
          ...useQueryFunctionOptions,
        });

        // Return newly generated property
        return target[property as keyof typeof target];
      }

      throw new TypeError(
        `Property ${property} is not defined and could not be generated`,
      );
    },
  });
};
