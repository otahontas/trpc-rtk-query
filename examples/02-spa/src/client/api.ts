/**
 * RTK Query API enhanced with tRPC
 */

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { enhanceApi } from "trpc-rtk-query";
import type { AppRouter } from "../server/router";

// Create tRPC client
const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "/trpc",
    }),
  ],
});

// Create base RTK Query API
const baseApi = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: "/" }),
  tagTypes: ["Todo", "User"],
  endpoints: () => ({}),
});

// Enhance with tRPC
export const api = enhanceApi({
  api: baseApi,
  client: trpcClient,
  endpointOptions: {
    // Todo endpoints
    todo_List: {
      providesTags: ["Todo"],
    },
    todo_GetById: {
      providesTags: (_result, _error, id) => [{ type: "Todo", id }],
    },
    todo_GetByUser: {
      providesTags: ["Todo"],
    },
    todo_Create: {
      invalidatesTags: ["Todo"],
    },
    todo_Update: {
      invalidatesTags: (_result, _error, { id }) => [{ type: "Todo", id }, "Todo"],
    },
    todo_Delete: {
      invalidatesTags: ["Todo"],
    },
    todo_ToggleComplete: {
      invalidatesTags: (_result, _error, id) => [{ type: "Todo", id }, "Todo"],
    },
    // User endpoints
    user_List: {
      providesTags: ["User"],
    },
    user_GetById: {
      providesTags: (_result, _error, id) => [{ type: "User", id }],
    },
  },
});

// Export hooks
export const {
  useTodo_ListQuery,
  useTodo_GetByIdQuery,
  useTodo_GetByUserQuery,
  useTodo_CreateMutation,
  useTodo_UpdateMutation,
  useTodo_DeleteMutation,
  useTodo_ToggleCompleteMutation,
  useUser_ListQuery,
  useUser_GetByIdQuery,
} = api;
