import {
  type Api,
  type BaseQueryApi,
  type BaseQueryFn,
  EndpointDefinitions,
  type MutationDefinition,
  type QueryDefinition,
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
import {
  type AnyProcedure,
  type AnyRouter,
  type Procedure,
  TRPCError,
  type inferProcedureInput,
  type inferProcedureOutput,
} from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";

// Get untyped client. TODO: use export from trpc when it's published to npm
export function getUntypedClient<TRouter extends AnyRouter>(
  client: CreateTRPCProxyClient<TRouter>,
): TRPCUntypedClient<TRouter> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client as any).__untypedClient;
}

// Follows trpc internal infer type pattern
type inferProcedureType<TProcedure extends AnyProcedure> = TProcedure extends Procedure<
  infer ProcedureType,
  // any is okay here, we don't care about the second param
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>
  ? ProcedureType
  : never;

// Flatten deeply nested routes, so we only have pairs of [endpoint name with path,
// procedure]. Try to first match against procedure and then against router. Otherwise
// return nothing
export type FlattenToEndpointProcedurePairs<
  MaybeProcedureRecord,
  EndpointPath extends string = "",
> = {
  [MaybeEndpointName in keyof MaybeProcedureRecord]: MaybeProcedureRecord[MaybeEndpointName] extends AnyProcedure
    ? [
        EndpointPath extends ""
          ? MaybeEndpointName
          : `${EndpointPath}_${Capitalize<Extract<MaybeEndpointName, string>>}`,
        MaybeProcedureRecord[MaybeEndpointName],
      ]
    : MaybeProcedureRecord[MaybeEndpointName] extends AnyRouter
    ? FlattenToEndpointProcedurePairs<
        MaybeProcedureRecord[MaybeEndpointName],
        EndpointPath extends ""
          ? MaybeEndpointName
          : `${EndpointPath}_${Capitalize<Extract<MaybeEndpointName, string>>}`
      >
    : never;
}[keyof MaybeProcedureRecord];

// Helper type to check extending against
type EndpointProcedurePair = [string, AnyProcedure];

// Create actual api definitions
type CreateTRPCApiEndpointDefinitions<
  TRouter extends AnyRouter,
  BaseQuery extends BaseQueryFn,
  TagTypes extends string,
  ReducerPath extends string,
> = {
  [Pair in FlattenToEndpointProcedurePairs<
    TRouter["_def"]["record"]
  > as Pair extends EndpointProcedurePair // should always extend but needs to be checked
    ? Pair[0]
    : never]: Pair extends EndpointProcedurePair // should always extend but needs to be checked
    ? Pair[1] extends AnyProcedure
      ? inferProcedureType<Pair[1]> extends infer ProcedureType
        ? ProcedureType extends "query"
          ? QueryDefinition<
              inferProcedureInput<Pair[1]>,
              BaseQuery,
              TagTypes,
              inferProcedureOutput<Pair[1]>,
              ReducerPath
            >
          : ProcedureType extends "mutation"
          ? MutationDefinition<
              inferProcedureInput<Pair[1]>,
              BaseQuery,
              TagTypes,
              inferProcedureOutput<Pair[1]>,
              ReducerPath
            >
          : never
        : never
      : never
    : never;
};

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

export type CreateTRPCApiOptions<TRouter extends AnyRouter> =
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
const formatEndpointToProcedurePathAndInjectToApi = <ProxyedApi extends Injectable>(
  proxyedApi: ProxyedApi,
  endpoint: string,
  procedureType: "mutation" | "query",
) => {
  const procedurePath = endpoint.includes("_")
    ? endpoint
        .split("_")
        .map((part) => deCapitalize(part))
        .join(".")
    : endpoint;
  proxyedApi.injectEndpoints({
    endpoints: (builder) => ({
      [endpoint]: builder[procedureType]({
        query: (procedureArguments: unknown) => ({
          procedureArguments,
          procedurePath,
          procedureType,
        }),
      }),
    }),
  });
};

// TODO: infer types correctly when passing in premade client or when getting client
export const createTRPCApi = <TRouter extends AnyRouter>(
  options: CreateTRPCApiOptions<TRouter>,
) => {
  // TODO: Extract to getBaseQuery, which generates the correct baseQuery for us
  const reducerPath = "TRPCApi" as const;
  const baseQuery = createBaseQuery(options);
  type TagTypes = string; // No tags
  type ReducerPath = typeof reducerPath;
  // Create underlying api that can be proxyed
  const nonProxyApi = createApi<
    TrpcApiBaseQuery,
    CreateTRPCApiEndpointDefinitions<TRouter, TrpcApiBaseQuery, TagTypes, ReducerPath>,
    ReducerPath,
    TagTypes
  >({
    baseQuery,
    // We're injecting endpoints later when they're exported
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    endpoints: () => ({} as any),
    reducerPath,
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

  return new Proxy(nonProxyApi, {
    get(target, property, receiver) {
      // If property was endpoints , user might want to call endpoint that isn't
      // yet generated. Return proxy that handles generating
      // TODO: can this be made cleaner, maybe recursion here?
      if (property === "endpoints") {
        // Any is okay, we know target has endpoints property
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return new Proxy((target as any)["endpoints"], {
          /* eslint-disable @typescript-eslint/no-explicit-any */
          get(endpointTarget, endpointProperty, endpointReceiver) {
            if (Reflect.has(endpointTarget, endpointProperty)) {
              return Reflect.get(endpointTarget, endpointProperty, endpointReceiver);
            }
            assertPropertyIsString(endpointProperty);

            // Return one more proxy that can actually inject the endpoint
            // We can't do it at this level yet, since we need to know the type of
            // operation (query or mutation) that's being called for the endpoint

            // Since endpoint in endpoints object might be undefined, we'll default
            // to empty object
            // any is okay, we know endpointTarget will be defined
            /* eslint-disable @typescript-eslint/no-explicit-any */
            return new Proxy((endpointTarget as any)[endpointProperty] ?? {}, {
              get(operationTarget, operationProperty, operationReceiver) {
                if (Reflect.has(operationTarget, operationProperty)) {
                  return Reflect.get(
                    operationTarget,
                    operationProperty,
                    operationReceiver,
                  );
                }
                assertPropertyIsString(operationProperty);
                const mutationOperation = "useMutation";
                const queryOperations = [
                  "useQuery",
                  "useQueryState",
                  "useQuerySubscription",
                  "useLazyQuery",
                  "useLazyQuerySubscription",
                ];
                let procedureType: "mutation" | "query" | undefined;
                if (operationProperty === mutationOperation) {
                  procedureType = "mutation" as const;
                } else if (queryOperations.includes(operationProperty)) {
                  procedureType = "query" as const;
                } else {
                  throw new TypeError(
                    `Property ${property}.${endpointProperty}.${operationProperty} is not defined and could not be generated`,
                  );
                }

                formatEndpointToProcedurePathAndInjectToApi(
                  target,
                  endpointProperty,
                  procedureType,
                );
                // endpoint injected, return it from the correct path
                return (target as any)["endpoints"][endpointProperty][
                  operationProperty
                ];
              },
            });
          },
        });
      }

      // if property is usePrefetch we need to wrap it with it's arguments, so
      // we can inject endpoint if needed
      if (property === "usePrefetch") {
        return (...arguments_: any[]) => {
          const [endpointName] = arguments_; // endpoint that should be in endpoints record
          if (!endpointName || typeof endpointName !== "string") {
            throw new TypeError(
              "usePrefetch must be called with endpoint name string as first arg",
            );
          }
          // If endpoint hasn't been yet injected, inject it. usePrefetch is always
          // for query endpoint.
          if (!(target as any)["endpoints"][endpointName]) {
            formatEndpointToProcedurePathAndInjectToApi(target, endpointName, "query");
          }
          return (target as any).usePrefetch(...arguments_);
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
        const capitalizedEndpointName = match[1];
        // pass through if parsing not okay with this regex
        if (!capitalizedEndpointName) {
          continue;
        }
        const endpointName = deCapitalize(capitalizedEndpointName);
        // check if it is actually deeper path for trpc, handle replacements correctly
        formatEndpointToProcedurePathAndInjectToApi(
          target,
          endpointName,
          procedureType,
        );

        // Return newly generated property
        return target[property as keyof typeof target];
      }

      throw new TypeError(
        `Property ${property} is not defined and could not be generated`,
      );
    },
  });
};
