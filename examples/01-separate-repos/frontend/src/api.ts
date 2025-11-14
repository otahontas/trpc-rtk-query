/**
 * RTK Query API enhanced with tRPC
 * This is the main integration point for trpc-rtk-query
 */

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { enhanceApi } from "trpc-rtk-query";
import type { AppRouter } from "./types";

// Backend URL - configure based on your environment
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

// Create tRPC client
const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${BACKEND_URL}/trpc`,
      // Add headers if needed (e.g., authentication)
      headers: async () => {
        return {
          // authorization: getAuthToken(),
        };
      },
    }),
  ],
});

// Create base RTK Query API
const baseApi = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: "/" }),
  tagTypes: ["User", "Post"],
  endpoints: () => ({}),
});

// Enhance the API with tRPC endpoints
export const api = enhanceApi({
  api: baseApi,
  client: trpcClient,
  // Configure endpoint-specific options
  endpointOptions: {
    // User endpoints
    user_List: {
      providesTags: ["User"],
    },
    user_GetById: {
      providesTags: (_result, _error, id) => [{ type: "User", id }],
    },
    user_Create: {
      invalidatesTags: ["User"],
    },
    user_Update: {
      invalidatesTags: (_result, _error, { id }) => [
        { type: "User", id },
        "User",
      ],
    },
    user_Delete: {
      invalidatesTags: ["User"],
    },
    // Post endpoints
    post_List: {
      providesTags: ["Post"],
    },
    post_GetById: {
      providesTags: (_result, _error, id) => [{ type: "Post", id }],
    },
    post_GetByAuthor: {
      providesTags: ["Post"],
    },
    post_Create: {
      invalidatesTags: ["Post"],
    },
    post_Update: {
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Post", id },
        "Post",
      ],
    },
    post_Delete: {
      invalidatesTags: ["Post"],
    },
  },
});

// Export hooks for usage in components
export const {
  // User hooks
  useUser_ListQuery,
  useUser_GetByIdQuery,
  useUser_CreateMutation,
  useUser_UpdateMutation,
  useUser_DeleteMutation,
  // Post hooks
  usePost_ListQuery,
  usePost_GetByIdQuery,
  usePost_GetByAuthorQuery,
  usePost_CreateMutation,
  usePost_UpdateMutation,
  usePost_DeleteMutation,
} = api;
