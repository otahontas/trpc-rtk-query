import { configureStore } from '@reduxjs/toolkit';
import { createApi } from '@reduxjs/toolkit/query/react';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
// Import from the built library tarball
import { enhanceApi } from 'trpc-rtk-query';
import type { AppRouter } from '../../server/router.js';

// Create an empty base API
const baseApi = createApi({
  reducerPath: 'trpcApi',
  baseQuery: () => ({ data: undefined }),
  endpoints: () => ({}),
});

// Create tRPC client
const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3456',
    }),
  ],
});

// Create the enhanced API using the built library
// All RTK Query hooks generated here are fully typed without any assertions
export const api = enhanceApi<AppRouter, typeof baseApi>({
  api: baseApi,
  client: trpcClient,
});

// Configure the store
export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
