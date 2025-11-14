import { type ApiEndpointQuery } from "@reduxjs/toolkit/query";
import {
  type Api,
  type BaseQueryFn,
  type EndpointDefinitions,
  createApi,
} from "@reduxjs/toolkit/query/react";
import { type AnyRouter } from "@trpc/server";

import { type CreateEndpointDefinitions } from "./create-endpoint-definitions.js";
import { type AnyApi, type SupportedModule } from "./rtk-types.js";
import { type TRPCClientOptions } from "./trpc-client-options.js";
import { type DisabledEndpointOptions, wrapApiToProxy } from "./wrap-api-to-proxy.js";

/**
 * Generic type for api that has injectEndpoint method for run time injection and
 * endpoints for reading previously generated definitions.
 * @internal
 **/
type InjectableWithEndpoints = Pick<AnyApi, "endpoints" | "injectEndpoints">;

/**
 * Enhances an existing RTK Query API with tRPC-generated endpoints and React hooks.
 *
 * This is the main function for integrating tRPC with RTK Query. It takes your tRPC
 * client and automatically generates fully-typed RTK Query endpoints for all your
 * tRPC procedures (queries and mutations).
 *
 * @template TRouter - Your tRPC router type (automatically inferred from the client)
 * @template ExistingApi - The type of your existing RTK Query API
 * @template BaseQuery - The base query function from your existing API
 * @template Endpoints - The endpoint definitions from your existing API
 * @template ReducerPath - The reducer path from your existing API
 * @template TagTypes - The tag types from your existing API
 * @template NewDefinitions - The new endpoint definitions generated from tRPC
 *
 * @param options - Configuration object for enhancing the API
 * @param options.api - An existing RTK Query API created with `createApi()` or `createEmptyApi()`
 * @param options.client - A tRPC proxy client created with `createTRPCProxyClient<AppRouter>()`.
 *                         Use this when you have a static client. Mutually exclusive with `getClient`.
 * @param options.getClient - A function that returns a tRPC client. Use this when you need
 *                            to access Redux state (e.g., for authentication tokens). Receives
 *                            `BaseQueryApi` as parameter. Mutually exclusive with `client`.
 * @param options.endpointOptions - Optional per-endpoint configuration for RTK Query features
 *                                   like `providesTags`, `invalidatesTags`, `onQueryStarted`, etc.
 *
 * @returns An enhanced API with generated hooks for all tRPC procedures. Nested router
 *          procedures are flattened with underscore separation (e.g., `user.list` becomes
 *          `useUser_listQuery`). Queries become `use[Name]Query` hooks and mutations become
 *          `use[Name]Mutation` hooks.
 *
 * @example
 * // With a static client
 * const api = enhanceApi({
 *   api: createEmptyApi(),
 *   client: trpcClient,
 *   endpointOptions: {
 *     userList: {
 *       providesTags: ['User'],
 *     },
 *   },
 * });
 * export const { useUserListQuery } = api;
 *
 * @example
 * // With dynamic client (accessing Redux state)
 * const api = enhanceApi({
 *   api: createEmptyApi(),
 *   getClient: async (baseQueryApi) => {
 *     const token = (baseQueryApi.getState() as RootState).auth.token;
 *     return createTRPCProxyClient<AppRouter>({
 *       links: [
 *         httpBatchLink({
 *           url: 'http://localhost:3000/trpc',
 *           headers: { authorization: `Bearer ${token}` },
 *         }),
 *       ],
 *     });
 *   },
 * });
 */
export const enhanceApi = <
  TRouter extends AnyRouter,
  ExistingApi extends InjectableWithEndpoints,
  // == "Save" the types needed to build up proper new api type to type variables ==
  // 1. Current baseQuery from existing api
  BaseQuery extends
    BaseQueryFn = ExistingApi["endpoints"][keyof ExistingApi["endpoints"]]["Types"]["BaseQuery"],
  // 2. Endpoints record values mapped to their inner definitions
  Endpoints = {
    [Endpoint in keyof ExistingApi["endpoints"]]: ExistingApi["endpoints"][Endpoint] extends ApiEndpointQuery<
      infer EndpointDefinition,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any
    >
      ? EndpointDefinition
      : never;
  },
  // 3. Reducer path
  ReducerPath extends
    string = ExistingApi["endpoints"][keyof ExistingApi["endpoints"]]["Types"]["ReducerPath"],
  // 4. Tag types
  TagTypes extends
    string = ExistingApi["endpoints"][keyof ExistingApi["endpoints"]]["Types"]["TagTypes"],
  // New definitions
  NewDefinitions extends EndpointDefinitions = CreateEndpointDefinitions<
    TRouter,
    BaseQuery,
    ReducerPath,
    TagTypes
  >,
>(
  options: {
    api: ExistingApi;
  } & {
    endpointOptions?: {
      [K in keyof NewDefinitions]?: Omit<NewDefinitions[K], DisabledEndpointOptions>;
    };
  } & TRPCClientOptions<TRouter>,
) =>
  wrapApiToProxy({
    api: options.api as Api<
      BaseQuery,
      CreateEndpointDefinitions<TRouter, BaseQuery, ReducerPath, TagTypes> & Endpoints,
      ReducerPath,
      TagTypes,
      SupportedModule
    >,
    endpointOptions: options.endpointOptions,
    tRPCClientOptions: options,
  });

/**
 * Creates an empty RTK Query API with no endpoints or base query configuration.
 *
 * This is a convenience helper function for when you don't have an existing RTK Query
 * API and want to start fresh with only tRPC-generated endpoints. It creates a minimal
 * API that can be enhanced with `enhanceApi()`.
 *
 * Under the hood, this creates an RTK Query API with:
 * - A no-op base query that returns `undefined`
 * - An empty endpoints object
 *
 * Use this when you're building a new application and want to use only tRPC procedures
 * through RTK Query, without any traditional REST endpoints.
 *
 * @returns A base RTK Query API with no endpoints, ready to be enhanced with tRPC procedures
 *
 * @example
 * // Create an empty API and enhance it with tRPC
 * const api = enhanceApi({
 *   api: createEmptyApi(),
 *   client: trpcClient,
 * });
 * export const { useUserListQuery } = api;
 *
 * @see {@link enhanceApi} for how to enhance this API with tRPC endpoints
 */
export const createEmptyApi = () =>
  createApi({
    baseQuery: () => ({ data: undefined }),
    endpoints: () => ({}),
  });
