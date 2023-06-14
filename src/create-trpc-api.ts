import type {
  BaseQueryFn,
  MutationDefinition,
  QueryDefinition,
} from "@reduxjs/toolkit/query/react";
import type { CreateTRPCClientOptions } from "@trpc/client";
import {
  TRPCError,
  type AnyProcedure,
  type AnyRouter,
  type Procedure,
  type inferProcedureInput,
  type inferProcedureOutput,
} from "@trpc/server";

import { createApi } from "@reduxjs/toolkit/query/react";
import { TRPCClientError, createTRPCUntypedClient } from "@trpc/client";
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

// TODO: handle deep merged routes with namespaces, like user.procedure
type CreateTRPCApiEndpointDefinitions<
  TRouter extends AnyRouter,
  BaseQuery extends BaseQueryFn,
  TagTypes extends string,
  ReducerPath extends string,
  Procedures = TRouter["_def"]["record"],
> = {
  [EndpointName in keyof Procedures]: Procedures[EndpointName] extends AnyProcedure
    ? inferProcedureType<Procedures[EndpointName]> extends infer ProcedureType
      ? ProcedureType extends "query"
        ? QueryDefinition<
            inferProcedureInput<Procedures[EndpointName]>,
            BaseQuery,
            TagTypes,
            inferProcedureOutput<Procedures[EndpointName]>,
            ReducerPath
          >
        : ProcedureType extends "mutation"
        ? MutationDefinition<
            inferProcedureInput<Procedures[EndpointName]>,
            BaseQuery,
            TagTypes,
            inferProcedureOutput<Procedures[EndpointName]>,
            ReducerPath
          >
        : never
      : never
    : never;
};

export type TRPCBaseQueryError =
  | {
      /**
       * * `"TRPC_CLIENT_ERROR"`:
       *   An error that happened on trpc client. Original error is stringified in error
       *   attribute.
       **/
      status: "TRPC_CLIENT_ERROR";
      data?: undefined;
      name: string;
      message: string;
      error: string;
    }
  | {
      /**
       * * `"TRPC_ERROR"`:
       *   An error that was returned by trpc backend. Original error is stringified in
       *   error attribute.
       **/
      status: "TRPC_ERROR";
      data?: undefined;
      name: string;
      statusCode: number;
      message: string;
      error: string;
    }
  | {
      /**
       * * `"CUSTOM_ERROR"`:
       *   A custom error type that you can return from your `queryFn` where another error might not make sense.
       **/
      status: "CUSTOM_ERROR";
      data?: unknown;
      error: string;
    };

const deCapitalize = (string_: string) => {
  const firstChar = string_[0];
  return firstChar ? string_.replace(firstChar, firstChar?.toLowerCase()) : string_;
};

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
    procedureArgs,
    procedureName,
    procedureType,
  }: {
    procedureArgs: unknown;
    procedureName: string;
    procedureType: "mutation" | "query";
  }) => {
    try {
      return {
        data: await client[procedureType](procedureName, procedureArgs),
      };
    } catch (error) {
      let properlyShapedError: {
        error: TRPCBaseQueryError;
      };
      if (error instanceof TRPCClientError) {
        properlyShapedError = {
          error: {
            status: "TRPC_CLIENT_ERROR",
            name: error.name,
            message: error.message,
            error: String(error),
          },
        };
      } else if (error instanceof TRPCError) {
        properlyShapedError = {
          error: {
            status: "TRPC_ERROR",
            name: error.name,
            statusCode: getHTTPStatusCodeFromError(error),
            message: error.message,
            error: String(error),
          },
        };
      } else {
        properlyShapedError = {
          error: {
            status: "CUSTOM_ERROR",
            error: String(error),
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

  // TODO:
  // add support for
  // - deep properties such as api.endpoints.getPosts.useQuerySubscription
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
    get(target, property) {
      // === Always call the property if it's already defined

      // eslint-disable-next-line no-prototype-builtins
      if (target.hasOwnProperty(property)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (target as any)[property as any];
      }

      // === Othewise, try to generate property

      // Can't really do anything here if symbol is not already part of api
      if (typeof property === "symbol") {
        throw new TypeError("Calling api with new symbol properties is not supported");
      }

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
        const procedure = deCapitalize(capitalizedEndpointName);
        target.injectEndpoints({
          endpoints: (builder) => ({
            [procedure]: builder[procedureType]({
              query: (procedureArguments: unknown) => ({
                procedureArgs: procedureArguments,
                procedureName: procedure,
                procedureType: "query",
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
