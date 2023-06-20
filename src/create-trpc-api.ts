import {
  type Api,
  type BaseQueryApi,
  type BaseQueryFn,
  EndpointDefinitions,
  createApi,
} from "@reduxjs/toolkit/query/react";
import {
  type CreateTRPCClientOptions,
  type CreateTRPCProxyClient,
  TRPCClientError,
  type TRPCRequestOptions,
  type TRPCUntypedClient,
  createTRPCUntypedClient,
} from "@trpc/client";
import { type AnyRouter, TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { isAnyObject, isString } from "is-what";

import { type CreateEndpointDefinitionsFromTRPCRouter } from "./create-endpoints-definitions";

// Get untyped client. TODO: use export from trpc when it's published to npm
// NOTE: we need to set a proper min version for trpc this can be actually used with
// premade clients
export function getUntypedClient<TRouter extends AnyRouter>(
  client: CreateTRPCProxyClient<TRouter>,
): TRPCUntypedClient<TRouter> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client as any).__untypedClient;
}

export type TRPCBaseQueryError =
  | {
      data?: undefined;
      error: string;
      message: string;
      name: string;
      /**
       * * `"TRPC_CLIENT_ERROR"`:
       *   An error that happened on trpc client. Original error is stringified in error
       *   attribute.
       **/
      status: "TRPC_CLIENT_ERROR";
    }
  | {
      data?: undefined;
      error: string;
      message: string;
      name: string;
      /**
       * * `"TRPC_ERROR"`:
       *   An error that was returned by trpc backend. Original error is stringified in
       *   error attribute.
       **/
      status: "TRPC_ERROR";
      statusCode: number;
    }
  | {
      data?: unknown;
      error: string;
      /**
       * * `"CUSTOM_ERROR"`:
       *   A custom error type that you can return from your `queryFn` where another error might not make sense.
       **/
      status: "CUSTOM_ERROR";
    };

const deCapitalize = (string_: string) => {
  const firstChar = string_[0];
  return firstChar ? string_.replace(firstChar, firstChar?.toLowerCase()) : string_;
};

// Note that assertions can't be declared with arrow functions. Otherwise we're
// following arrow function style here.
function assertPropertyIsString(property: string | symbol): asserts property is string {
  if (typeof property === "symbol") {
    throw new TypeError("Calling api with new symbol properties is not supported");
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyApi = Api<BaseQueryFn, EndpointDefinitions, any, any>;

type CreateTRPCApiClientOptions<TRouter extends AnyRouter> =
  | {
      client: CreateTRPCProxyClient<TRouter>;
      clientOptions?: never;
      getClient?: never;
    }
  | {
      client?: never;
      clientOptions: CreateTRPCClientOptions<TRouter>;
      getClient?: never;
    }
  | {
      client?: never;
      clientOptions?: never;
      getClient: (
        baseQueryApi: BaseQueryApi,
      ) => Promise<CreateTRPCProxyClient<TRouter>>;
    };

type CreateTRPCApiApiOptions<ExistingApi extends AnyApi> = {
  api?: ExistingApi;
};

export type CreateTRPCApiOptions<
  TRouter extends AnyRouter,
  ExistingApi extends AnyApi = AnyApi,
> = CreateTRPCApiClientOptions<TRouter> & CreateTRPCApiApiOptions<ExistingApi>;

type BaseQueryArguments = {
  // Okay to be unknown, we handle argument type safety at rtk query level.
  // This is just forwarding arguments to trpc client
  procedureArguments: unknown;
  procedurePath: string;
  procedureType: "mutation" | "query";
};
type BaseQueryResult = unknown; // TODO: type properly from Router
type ExtraOptions = TRPCRequestOptions;
// eslint-disable-next-line @typescript-eslint/ban-types
type Meta = {}; // TODO: add a proper meta type
type TrpcApiBaseQuery = BaseQueryFn<
  BaseQueryArguments,
  BaseQueryResult,
  TRPCBaseQueryError,
  ExtraOptions,
  Meta
>;

type ClientResult<TRouter extends AnyRouter> =
  | {
      client: TRPCUntypedClient<TRouter>;
      clientReady: true;
    }
  | {
      clientReady: false;
      getClient: NonNullable<CreateTRPCApiOptions<TRouter>["getClient"]>;
    };

// This baseQuery tries to follow conventions from RTK query's fetchBaseQuery wrapper
const createBaseQuery = <TRouter extends AnyRouter>(
  createTRPCApiOptions: CreateTRPCApiOptions<TRouter>,
): TrpcApiBaseQuery => {
  const clientResult = ((): ClientResult<TRouter> => {
    if ("client" in createTRPCApiOptions) {
      return {
        client: getUntypedClient<TRouter>(createTRPCApiOptions.client),
        clientReady: true,
      };
    } else if ("clientOptions" in createTRPCApiOptions) {
      return {
        client: createTRPCUntypedClient(createTRPCApiOptions.clientOptions),
        clientReady: true,
      };
    }
    return {
      clientReady: false,
      getClient: createTRPCApiOptions.getClient,
    };
  })();

  return async (baseQueryArguments, baseQueryApi, options) => {
    try {
      const {
        procedureArguments: arguments_,
        procedurePath: path,
        procedureType,
      } = baseQueryArguments;
      const clientToUse = clientResult.clientReady
        ? clientResult.client
        : getUntypedClient<TRouter>(await clientResult.getClient(baseQueryApi));
      const data = await clientToUse[procedureType](path, arguments_, options);
      return {
        data,
      };
    } catch (error) {
      let properlyShapedError: {
        error: TRPCBaseQueryError;
      };
      if (error instanceof TRPCClientError) {
        properlyShapedError = {
          error: {
            error: String(error),
            message: error.message,
            name: error.name,
            status: "TRPC_CLIENT_ERROR",
          },
        };
      } else if (error instanceof TRPCError) {
        properlyShapedError = {
          error: {
            error: String(error),
            message: error.message,
            name: error.name,
            status: "TRPC_ERROR",
            statusCode: getHTTPStatusCodeFromError(error),
          },
        };
      } else {
        properlyShapedError = {
          error: {
            error: String(error),
            status: "CUSTOM_ERROR",
          },
        };
      }
      return properlyShapedError;
    }
  };
};

type Injectable = Pick<
  // Any is okay, we just need this to check that proxyedApi is correctly shaped
  // and that we have correct params for baseQuery
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Api<TrpcApiBaseQuery, EndpointDefinitions, any, any>,
  "injectEndpoints"
>;

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
        // TODO: curry, so we don't have to pass all three args
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        queryFn: (procedureArguments: unknown, api: any, extraOptions: any) =>
          // eslint-disable-next-line unicorn/consistent-destructuring
          createBaseQuery(options.createTrpcApiClientOptions)(
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

// TODO: infer types correctly when passing in premade client or when getting client
export const createTRPCApi = <
  TRouter extends AnyRouter,
  ExistingApi extends AnyApi = AnyApi,
>(
  options: CreateTRPCApiOptions<TRouter, ExistingApi>,
) => {
  const reducerPath = "TRPCApi" as const;
  const baseQuery = createBaseQuery(options);
  type TagTypes = string; // No tags
  type ReducerPath = typeof reducerPath;

  // Create underlying api that can be proxyed
  // TODO: very hacky types here, handle inferring types from passed api correctly
  const newApi = createApi<
    TrpcApiBaseQuery,
    CreateEndpointDefinitionsFromTRPCRouter<
      TRouter,
      TrpcApiBaseQuery,
      TagTypes,
      ReducerPath
    >,
    ReducerPath,
    TagTypes
  >({
    baseQuery,
    // We're injecting endpoints later when they're exported
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    endpoints: () => ({} as any),
    reducerPath,
  });
  const nonProxyApi = options.api ? (options.api as typeof newApi) : newApi;

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

  const useQueryFunctionOptions = options.api
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
            return endpoints[endpoint][operation];
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
