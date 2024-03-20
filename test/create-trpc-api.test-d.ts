import { createApi, skipToken } from "@reduxjs/toolkit/query/react";
import { createTRPCProxyClient } from "@trpc/client";
import { describe, expectTypeOf, it } from "vitest";

import { enhanceApi } from "../src";
import { type AppRouter, testClientOptions } from "./fixtures";

type QueryRoutes =
  | "extraProcedure1"
  | "extraProcedure2"
  | "extraProcedure3"
  | "extraProcedure4"
  | "extraProcedure5"
  | "extraProcedure6"
  | "extraProcedure7"
  | "extraProcedure8"
  | "extraProcedure9"
  | "extraProcedure10"
  | "getUserById"
  | "listUsers"
  | "nested_Deep_GetVeryNestedMessage";
// Tests each scenery with one query and one mutation
// This can't be really parametrized since these are statically checked, so we need
// to copypaste each test case.
describe("create-trpc-api", () => {
  it("allows injecting trpc api to existing api while infering types from client and api", () => {
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
        endpoints: (builder) => ({
          getResponse: builder.query<string, string>({
            query: (string_: string) => string_,
          }),
        }),
        reducerPath: "premadeApi",
      }),

      client,
    });

    const {
      endpoints: {
        getUserById: {
          useLazyQuery,
          useLazyQuerySubscription,
          useQuery,
          useQueryState,
          useQuerySubscription,
        },
      },
      useGetUserByIdQuery,
      useNested_Deep_GetVeryNestedMessageQuery,
      usePrefetch,
      useUpdateNameMutation,
    } = api;

    // Basic queries
    expectTypeOf(useGetUserByIdQuery).toBeFunction();
    expectTypeOf(useGetUserByIdQuery)
      .parameter(0)
      .exclude<typeof skipToken>()
      .toMatchTypeOf<number>();
    expectTypeOf(useUpdateNameMutation).toBeFunction();
    type UseUpdateNameMutationTriggerArgument = Parameters<
      ReturnType<typeof useUpdateNameMutation>[0]
    >[0];
    expectTypeOf<UseUpdateNameMutationTriggerArgument>().toMatchTypeOf<{
      id: number;
      name: string;
    }>();

    // Deeply nested query & same query through endpoints
    expectTypeOf(useNested_Deep_GetVeryNestedMessageQuery).toBeFunction();
    expectTypeOf(useNested_Deep_GetVeryNestedMessageQuery)
      .parameter(0)
      .exclude<typeof skipToken>()
      .toMatchTypeOf<{ deepInput: string }>();
    expectTypeOf(
      // eslint-disable-next-line unicorn/consistent-destructuring
      api.endpoints.nested_Deep_GetVeryNestedMessage.useQuery,
    ).toBeFunction();

    // queries through endpoint
    expectTypeOf(useLazyQuery).toBeFunction();
    expectTypeOf(useLazyQuerySubscription).toBeFunction();
    expectTypeOf(useQuery).toBeFunction();
    expectTypeOf(useQueryState).toBeFunction();
    expectTypeOf(useQuerySubscription).toBeFunction();

    // use prefetch should have types from both previous and trpc endpoints
    expectTypeOf(usePrefetch).toBeFunction();
    expectTypeOf(usePrefetch).parameter(0).toMatchTypeOf<"getResponse" | QueryRoutes>();

    // existing query through api & endpoints.getResponse
    const {
      endpoints: { getResponse },
      useGetResponseQuery,
    } = api;
    expectTypeOf(useGetResponseQuery).toBeFunction();
    expectTypeOf(useGetResponseQuery)
      .parameter(0)
      .exclude<typeof skipToken>()
      .toMatchTypeOf<string>();
    expectTypeOf(getResponse.useQuery).toBeFunction();
    expectTypeOf(getResponse.useQuery)
      .parameter(0)
      .exclude<typeof skipToken>()
      .toMatchTypeOf<string>();
  });

  it("allows injecting trpc api to existing api infering types from getclient", () => {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const getClient = async () => createTRPCProxyClient<AppRouter>(testClientOptions);

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
          getResponse: builder.query<string, string>({
            query: (string_: string) => string_,
          }),
        }),
        reducerPath: "premadeApi",
      }),
      getClient,
    });
    const {
      endpoints: {
        getUserById: {
          useLazyQuery,
          useLazyQuerySubscription,
          useQuery,
          useQueryState,
          useQuerySubscription,
        },
      },
      useGetUserByIdQuery,
      useNested_Deep_GetVeryNestedMessageQuery,
      usePrefetch,
      useUpdateNameMutation,
    } = api;

    // Basic queries
    expectTypeOf(useGetUserByIdQuery).toBeFunction();
    expectTypeOf(useGetUserByIdQuery)
      .parameter(0)
      .exclude<typeof skipToken>()
      .toMatchTypeOf<number>();
    expectTypeOf(useUpdateNameMutation).toBeFunction();
    type UseUpdateNameMutationTriggerArgument = Parameters<
      ReturnType<typeof useUpdateNameMutation>[0]
    >[0];
    expectTypeOf<UseUpdateNameMutationTriggerArgument>().toMatchTypeOf<{
      id: number;
      name: string;
    }>();

    // Deeply nested query & same query through endpoints
    expectTypeOf(useNested_Deep_GetVeryNestedMessageQuery).toBeFunction();
    expectTypeOf(useNested_Deep_GetVeryNestedMessageQuery)
      .parameter(0)
      .exclude<typeof skipToken>()
      .toMatchTypeOf<{ deepInput: string }>();
    expectTypeOf(
      // eslint-disable-next-line unicorn/consistent-destructuring
      api.endpoints.nested_Deep_GetVeryNestedMessage.useQuery,
    ).toBeFunction();

    // queries through endpoint
    expectTypeOf(useLazyQuery).toBeFunction();
    expectTypeOf(useLazyQuerySubscription).toBeFunction();
    expectTypeOf(useQuery).toBeFunction();
    expectTypeOf(useQueryState).toBeFunction();
    expectTypeOf(useQuerySubscription).toBeFunction();

    // use prefetch should have types from both previous and trpc endpoints
    expectTypeOf(usePrefetch).toBeFunction();
    expectTypeOf(usePrefetch).parameter(0).toMatchTypeOf<"getResponse" | QueryRoutes>();

    // existing query through api & endpoints.getResponse
    const {
      endpoints: { getResponse },
      useGetResponseQuery,
    } = api;
    expectTypeOf(useGetResponseQuery).toBeFunction();
    expectTypeOf(useGetResponseQuery)
      .parameter(0)
      .exclude<typeof skipToken>()
      .toMatchTypeOf<string>();
    expectTypeOf(getResponse.useQuery).toBeFunction();
    expectTypeOf(getResponse.useQuery)
      .parameter(0)
      .exclude<typeof skipToken>()
      .toMatchTypeOf<string>();
  });

  it("allows passing options for endpoints when enhancing api", () => {
    const client = createTRPCProxyClient<AppRouter>(testClientOptions);
    const existingApi = createApi({
      baseQuery: (string_: string) => {
        return {
          data: {
            string_,
          },
        };
      },
      endpoints: (builder) => ({
        getResponse: builder.query<string, string>({
          query: (string_: string) => string_,
        }),
      }),
      reducerPath: "premadeApi",
      tagTypes: ["User"],
    });

    const api = enhanceApi({
      api: existingApi,
      client,
      endpointOptions: {
        getUserById: {
          providesTags: (result) => ["User", { id: result?.id }],
        },
        updateName: {
          async onQueryStarted({ id, name }, { dispatch, queryFulfilled }) {
            const patchResult = dispatch(
              api.util.updateQueryData("getUserById", id, (draft) => {
                Object.assign(draft, { name });
              }),
            );
            try {
              await queryFulfilled;
            } catch {
              patchResult.undo();
            }
          },
        },
      },
    });
    // Check that types for queries are still correct
    const { useGetResponseQuery, useGetUserByIdQuery } = api;

    // existing query through api & endpoints.getResponse
    expectTypeOf(useGetResponseQuery).toBeFunction();
    expectTypeOf(useGetResponseQuery)
      .parameter(0)
      .exclude<typeof skipToken>()
      .toMatchTypeOf<string>();

    // Basic queries
    expectTypeOf(useGetUserByIdQuery).toBeFunction();
    expectTypeOf(useGetUserByIdQuery)
      .parameter(0)
      .exclude<typeof skipToken>()
      .toMatchTypeOf<number>();
  });
});
