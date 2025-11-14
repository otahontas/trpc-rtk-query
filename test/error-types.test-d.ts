import { createApi } from "@reduxjs/toolkit/query/react";
import { createTRPCProxyClient } from "@trpc/client";
import { describe, expectTypeOf, it } from "vitest";

import { type TRPCBaseQueryError, enhanceApi } from "../src/index.js";
import { type AppRouter, testClientOptions } from "./fixtures.js";

describe("error type definitions", () => {
  describe("for tRPC endpoints with TRPCBaseQuery", () => {
    it("should type errors as TRPCBaseQueryError for query hooks", () => {
      const client = createTRPCProxyClient<AppRouter>(testClientOptions);

      const api = enhanceApi({
        api: createApi({
          baseQuery: (string_: string) => {
            return {
              data: {
                string_,
              },
            };
          },
          endpoints: () => ({}),
          reducerPath: "api",
        }),
        client,
      });

      const { useGetUserByIdQuery } = api;

      // Test that error type is TRPCBaseQueryError
      type QueryResult = ReturnType<typeof useGetUserByIdQuery>;
      type ErrorType = QueryResult["error"];

      expectTypeOf<ErrorType>().toMatchTypeOf<TRPCBaseQueryError | undefined>();
    });

    it("should type errors as TRPCBaseQueryError for mutation hooks", () => {
      const client = createTRPCProxyClient<AppRouter>(testClientOptions);

      const api = enhanceApi({
        api: createApi({
          baseQuery: (string_: string) => {
            return {
              data: {
                string_,
              },
            };
          },
          endpoints: () => ({}),
          reducerPath: "api",
        }),
        client,
      });

      const { useUpdateNameMutation } = api;

      // Test that error type is TRPCBaseQueryError
      type MutationResult = ReturnType<typeof useUpdateNameMutation>[1];
      type ErrorType = MutationResult["error"];

      expectTypeOf<ErrorType>().toMatchTypeOf<TRPCBaseQueryError | undefined>();
    });

    it("should allow discriminating error types based on status", () => {
      const client = createTRPCProxyClient<AppRouter>(testClientOptions);

      const api = enhanceApi({
        api: createApi({
          baseQuery: (string_: string) => {
            return {
              data: {
                string_,
              },
            };
          },
          endpoints: () => ({}),
          reducerPath: "api",
        }),
        client,
      });

      const { useGetUserByIdQuery } = api;
      type QueryResult = ReturnType<typeof useGetUserByIdQuery>;
      type ErrorType = NonNullable<QueryResult["error"]>;

      // Test discriminated union - TRPC_CLIENT_ERROR
      type ClientError = Extract<ErrorType, { status: "TRPC_CLIENT_ERROR" }>;
      expectTypeOf<ClientError>().toHaveProperty("message");
      expectTypeOf<ClientError>().toHaveProperty("name");
      expectTypeOf<ClientError>().toHaveProperty("error");
      expectTypeOf<ClientError>().toHaveProperty("status");

      // Test discriminated union - TRPC_ERROR
      type TRPCError = Extract<ErrorType, { status: "TRPC_ERROR" }>;
      expectTypeOf<TRPCError>().toHaveProperty("message");
      expectTypeOf<TRPCError>().toHaveProperty("name");
      expectTypeOf<TRPCError>().toHaveProperty("error");
      expectTypeOf<TRPCError>().toHaveProperty("statusCode");

      // Test discriminated union - UNKNOWN_ERROR
      type UnknownError = Extract<ErrorType, { status: "UNKNOWN_ERROR" }>;
      expectTypeOf<UnknownError>().toHaveProperty("error");
      expectTypeOf<UnknownError>().toHaveProperty("status");
    });

    it("should type errors correctly when enhancing API with different base query error type", () => {
      const client = createTRPCProxyClient<AppRouter>(testClientOptions);

      // Create API with custom base query that returns different error type
      const api = enhanceApi({
        api: createApi({
          baseQuery: (string_: string) => {
            return {
              data: {
                string_,
              },
            };
          },
          endpoints: (builder) => ({
            customEndpoint: builder.query<string, string>({
              query: (argument) => argument,
            }),
          }),
          reducerPath: "api",
        }),
        client,
      });

      const { useGetUserByIdQuery } = api;

      // tRPC endpoint should have TRPCBaseQueryError regardless of existing API's error type
      type TRPCQueryResult = ReturnType<typeof useGetUserByIdQuery>;
      type TRPCErrorType = TRPCQueryResult["error"];
      expectTypeOf<TRPCErrorType>().toMatchTypeOf<TRPCBaseQueryError | undefined>();
    });
  });
});
