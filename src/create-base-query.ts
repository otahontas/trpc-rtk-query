import { type BaseQueryFn } from "@reduxjs/toolkit/query/react";
import {
  TRPCClientError,
  type TRPCRequestOptions,
  TRPCUntypedClient,
  createTRPCUntypedClient,
  getUntypedClient,
} from "@trpc/client";
import { type AnyRouter, TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";

import { CreateTRPCApiClientOptions } from "./create-trpc-api-client-options";

/* Errors baseQuery can return. Follows the conventions of RTK query's fetchBaseQuery */
export type TRPCBaseQueryError =
  | {
      /**
       * * `"TRPC_CLIENT_ERROR"`:
       *   An error that happened on trpc client. Original error is stringified in error
       *   attribute.
       **/
      data?: undefined;
      error: string;
      message: string;
      name: string;
      status: "TRPC_CLIENT_ERROR";
    }
  | {
      /**
       * * `"TRPC_ERROR"`:
       *   An error that was returned by trpc backend. Original error is stringified in
       *   error attribute.
       **/
      data?: undefined;
      error: string;
      message: string;
      name: string;
      status: "TRPC_ERROR";
      statusCode: number;
    }
  | {
      /**
       * * `"UNKNOWN_ERROR"`:
       *   A unknown error type that captures error not wrapped by trpc. Original error
       *   is stringified in error attribute
       **/
      data?: unknown;
      error: string;
      status: "UNKNOWN_ERROR";
    };

/** Helper type to differentiate between whether client is ready to be used or should
 *  be grabbed from callback
 *  @internal
 **/
type ClientStatus<TRouter extends AnyRouter> =
  | {
      client: TRPCUntypedClient<TRouter>;
      ready: true;
    }
  | {
      getClient: NonNullable<CreateTRPCApiClientOptions<TRouter>["getClient"]>;
      ready: false;
    };

/** Resolve how to get the trpc client
 * @internal
 **/
const resolveClientStatus = <TRouter extends AnyRouter>(
  createTRPCApiClientOptions: CreateTRPCApiClientOptions<TRouter>,
): ClientStatus<TRouter> => {
  if ("client" in createTRPCApiClientOptions) {
    return {
      client: getUntypedClient<TRouter>(createTRPCApiClientOptions.client),
      ready: true,
    };
  } else if ("clientOptions" in createTRPCApiClientOptions) {
    return {
      client: createTRPCUntypedClient<TRouter>(
        createTRPCApiClientOptions.clientOptions,
      ),
      ready: true,
    };
  }
  return {
    getClient: createTRPCApiClientOptions.getClient,
    ready: false,
  };
};

/** Typings for base query that (not previously existing) api created with
 * createTRPCApi uses.
 **/
export type BaseQueryForTRPCClient = BaseQueryFn<
  // Arguments for baseQuery. Should be used when injecting endpoints
  {
    procedureArguments: unknown;
    procedurePath: string;
    procedureType: "mutation" | "query";
  },
  // Result type. Endpoint definitions are typed manually instead of deriving them from
  // this type, so it's enough that this is unknown.
  unknown,
  // Use typed errors
  TRPCBaseQueryError,
  // Allow request options (e.g context and signal) to be passed in via extra options
  TRPCRequestOptions,
  // No meta is returned
  never
>;

/** Create a base query that uses trpc client under the hood.
 **/
export const createBaseQueryForTRPCClient = <TRouter extends AnyRouter>(
  createTRPCApiClientOptions: CreateTRPCApiClientOptions<TRouter>,
): BaseQueryForTRPCClient => {
  const clientStatus = resolveClientStatus(createTRPCApiClientOptions);

  return async (baseQueryArguments, baseQueryApi, extraOptions) => {
    try {
      const { procedureArguments, procedurePath, procedureType } = baseQueryArguments;
      const resolvedClient = clientStatus.ready
        ? clientStatus.client
        : getUntypedClient<TRouter>(await clientStatus.getClient(baseQueryApi));
      return {
        data: await resolvedClient[procedureType](
          procedurePath,
          procedureArguments,
          extraOptions,
        ),
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
            status: "UNKNOWN_ERROR",
          },
        };
      }
      return properlyShapedError;
    }
  };
};
