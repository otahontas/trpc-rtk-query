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
import { type EndpointOptions, wrapApiToProxy } from "./wrap-api-to-proxy.js";

/**
 * Generic type for api that has injectEndpoint method for run time injection and
 * endpoints for reading previously generated definitions.
 * @internal
 **/
type InjectableWithEndpoints = Pick<AnyApi, "endpoints" | "injectEndpoints">;

/*
 * Enhances existing api with endpoints and react hooks generated from trpc types.
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
    endpointOptions?: EndpointOptions<NewDefinitions>;
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

/*
 * Helper to create base api with no endpoints
 */
export const createEmptyApi = () =>
  createApi({
    baseQuery: () => ({ data: undefined }),
    endpoints: () => ({}),
  });
