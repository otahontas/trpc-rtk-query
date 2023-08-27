import {
  createApi as createRTKQueryApi,
  skipToken,
} from "@reduxjs/toolkit/query/react";
import { createTRPCProxyClient } from "@trpc/client";
import { describe, expectTypeOf, it } from "vitest";

import { createApi, enhanceApi } from "../src";
import { type AppRouter, testClientOptions } from "./fixtures";

// Tests each scenery with one query and one mutation
// This can't be really parametrized since these are statically checked, so we need
// to copypaste each test case.
describe("create-trpc-api", () => {
  it("allows creating api while infering type from client", () => {
    const client = createTRPCProxyClient<AppRouter>(testClientOptions);

    const api = createApi({
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

    // use prefetch

    expectTypeOf(usePrefetch).toBeFunction();
    expectTypeOf(usePrefetch)
      .parameter(0)
      .toMatchTypeOf<
        "getUserById" | "listUsers" | "nested_Deep_GetVeryNestedMessage"
      >();
  });

  it("allows creating api with get client while infering types from getClient func", () => {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const getClient = async () => createTRPCProxyClient<AppRouter>(testClientOptions);

    const api = createApi({
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

    // use prefetch
    expectTypeOf(usePrefetch).toBeFunction();
    expectTypeOf(usePrefetch)
      .parameter(0)
      .toMatchTypeOf<
        "getUserById" | "listUsers" | "nested_Deep_GetVeryNestedMessage"
      >();
  });

  it("allows injecting trpc api to existing api while infering types from client and api", () => {
    const client = createTRPCProxyClient<AppRouter>(testClientOptions);

    const api = enhanceApi({
      api: createRTKQueryApi({
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
    expectTypeOf(usePrefetch)
      .parameter(0)
      .toMatchTypeOf<
        "getResponse" | "getUserById" | "listUsers" | "nested_Deep_GetVeryNestedMessage"
      >();

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
      api: createRTKQueryApi({
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
    expectTypeOf(usePrefetch)
      .parameter(0)
      .toMatchTypeOf<
        "getResponse" | "getUserById" | "listUsers" | "nested_Deep_GetVeryNestedMessage"
      >();

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

  it("prevents passing in mutually exclusive args", () => {
    // @ts-expect-error Should not be possible to pass both client and getClient
    createApi({
      client: createTRPCProxyClient<AppRouter>(testClientOptions),
      getClient: async () => createTRPCProxyClient<AppRouter>(testClientOptions),
    });
  });

  it("allows passing api options when creating new api", () => {
    const client = createTRPCProxyClient<AppRouter>(testClientOptions);
    const api = createApi({
      client,
      reducerPath: "jeeApi",
      tagTypes: ["User"],
    });
    api.injectEndpoints({
      endpoints: (builder) => ({
        getUserById: builder.query<string, number>({
          providesTags: ["User"], // can provide tag
          queryFn: async (id) => {
            return { data: `user ${id}` };
          },
        }),
      }),
    });
    expectTypeOf(api["reducerPath"]).toMatchTypeOf<"jeeApi">();
  });

  it("prevents passing api options that are injected by this library when creating new api", () => {
    const client = createTRPCProxyClient<AppRouter>(testClientOptions);
    createApi({
      //@ts-expect-error shouldn't be possible to pass baseQuery
      baseQuery: (() => {}) as any,
      client,
    });

    createApi({
      client,
      //@ts-expect-error shouldn't be possible to pass endpoints
      endpoints: {} as any,
    });
  });

  it("allows passing options for endpoints when enhancing api", () => {
    const client = createTRPCProxyClient<AppRouter>(testClientOptions);
    const existingApi = createRTKQueryApi({
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
