import type {
  BaseQueryFn,
  MutationDefinition,
  QueryDefinition,
} from "@reduxjs/toolkit/query/react";
import type { CreateTRPCClientOptions } from "@trpc/client";

import { createApi } from "@reduxjs/toolkit/query/react";
import { TRPCClientError, createTRPCUntypedClient } from "@trpc/client";
import {
  type AnyProcedure,
  type AnyRouter,
  type Procedure,
  TRPCError,
  type inferProcedureInput,
  type inferProcedureOutput,
} from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";

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

export const createTRPCApi = <TRouter extends AnyRouter>(
  options: CreateTRPCClientOptions<TRouter>,
) => {
  // TRPC Client
  // TODO: Allow passing from outside
  const client = createTRPCUntypedClient(options);

  // RTK Query api

  // This baseQuery tries to follow conventions from RTK query's fetchBaseQuery wrapper
  // TODO: allow passing original api from outside and inject endpoints instead of
  const baseQuery = async ({
    arguments_,
    path,
    procedureType,
  }: {
    arguments_: unknown;
    path: string;
    procedureType: "mutation" | "query";
  }) => {
    try {
      // TODO: make it possible to pass in options?
      return {
        data: await client[procedureType](path, arguments_),
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
  const reducerPath = "TRPCApi" as const;
  type TagTypes = never; // No tags
  type ReducerPath = typeof reducerPath;
  type BaseQuery = typeof baseQuery;
  // Create underlying api that can be proxyed
  const nonProxyApi = createApi<
    BaseQuery,
    CreateTRPCApiEndpointDefinitions<TRouter, BaseQuery, TagTypes, ReducerPath>,
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

  /* eslint-disable @typescript-eslint/no-explicit-any */
  /* eslint-disable no-prototype-builtins */
  return new Proxy(nonProxyApi, {
    get(target, property) {
      // If property was endpoints , user might want to call endpoint that isn't
      // yet generated. Return proxy that handles generating
      // TODO: can this be made cleaner, maybe recursion here?
      if (property === "endpoints") {
        return new Proxy((target as any)[property as any], {
          get(endpointTarget, endpointProperty) {
            // Validate & call the property if is already defined
            if (endpointTarget.hasOwnProperty(property)) {
              return (endpointTarget as any)[property as any];
            }
            assertPropertyIsString(endpointProperty);

            // Return one more proxy that can actually inject the endpoint
            // We can't do it at this level yet, since we need to know the type of
            // operation (query or mutation) that's being called for the endpoint
            //
            // Since endpoint in endpoints object might be undefined, we pass default
            // to empty object
            return new Proxy((endpointTarget as any)[endpointProperty as any] ?? {}, {
              get(operationTarget, operationProperty) {
                if (operationTarget.hasOwnProperty(property)) {
                  return (operationTarget as any)[property as any];
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

                // default to state where we don't find operationProperty
                let procedureTypeResult:
                  | {
                      data: "mutation" | "query";
                      success: true;
                    }
                  | {
                      error: string;
                      success: false;
                    } = {
                  error: `Property ${property}.${endpointProperty}.${operationProperty} is not defined and could not be generated`,
                  success: false,
                };
                if (operationProperty === mutationOperation) {
                  procedureTypeResult = {
                    data: "mutation",
                    success: true,
                  };
                } else if (queryOperations.includes(operationProperty)) {
                  procedureTypeResult = {
                    data: "query",
                    success: true,
                  };
                }

                if (!procedureTypeResult.success) {
                  throw new TypeError(procedureTypeResult.error);
                }
                const { data: procedureType } = procedureTypeResult;
                // Endpoint property is the correct endpoint name to generate.
                // check if it is actually deeper path for trpc, handle replacements correctly
                const path = endpointProperty.includes("_")
                  ? endpointProperty
                      .split("_")
                      .map((part) => deCapitalize(part))
                      .join(".")
                  : endpointProperty;
                // TODO: refactor injecting endpoint to external function, it's called
                // always similarly
                target.injectEndpoints({
                  endpoints: (builder) => ({
                    [endpointProperty]: builder[procedureType]({
                      query: (arguments_: unknown) => ({
                        arguments_,
                        path,
                        procedureType,
                      }),
                    }),
                  }),
                });
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
          // If endpoint hasn't been yet injected, inject it. UsePrefetch handles
          // only queries
          if (!(target as any)["endpoints"][endpointName]) {
            // check if it is actually deeper path for trpc, handle replacements correctly
            const path = endpointName.includes("_")
              ? endpointName
                  .split("_")
                  .map((part) => deCapitalize(part))
                  .join(".")
              : endpointName;
            target.injectEndpoints({
              endpoints: (builder) => ({
                [endpointName]: builder.query({
                  query: (arguments_: unknown) => ({
                    arguments_,
                    path,
                    procedureType: "query",
                  }),
                }),
              }),
            });
          }
          return (target as any).usePrefetch(...arguments_);
        };
      }

      // Generate the endpoint

      // TODO: should we use Reflect instead?
      if (target.hasOwnProperty(property)) {
        return (target as any)[property as any];
      }
      /* eslint-enable @typescript-eslint/no-explicit-any */
      /* eslint-enable no-prototype-builtins */
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
        const path = endpointName.includes("_")
          ? endpointName
              .split("_")
              .map((part) => deCapitalize(part))
              .join(".")
          : endpointName;
        target.injectEndpoints({
          endpoints: (builder) => ({
            [endpointName]: builder[procedureType]({
              query: (arguments_: unknown) => ({
                arguments_,
                path,
                procedureType,
              }),
            }),
          }),
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
