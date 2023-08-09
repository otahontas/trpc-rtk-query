import { type ApiEndpointQuery } from "@reduxjs/toolkit/dist/query/core/module"; // TODO: don't import from dist
import {
  type Api,
  type BaseQueryFn,
  // type CreateApiOptions,
  createApi as createRTKQueryApi,
} from "@reduxjs/toolkit/query/react";
import { type AnyRouter } from "@trpc/server";

import { type CreateEndpointDefinitions } from "./create-endpoint-definitions";
import { type TRPCBaseQuery, createTRPCBaseQuery } from "./create-trpc-base-query";
import { type AnyApi, type SupportedModule } from "./rtk-types";
import { type TRPCClientOptions } from "./trpc-client-options";
import { wrapApiToProxy } from "./wrap-api-to-proxy";

// TODO: Allow passing in partial endpoint object that can be used for e.g. optimistic
// queries
// TODO: Allow passing in settings for api (reducerpath, tagtypes etc)
// type NonAllowedApiOptions = Extract<
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   keyof CreateApiOptions<any, any, any, any>,
//   "baseQuery" | "endpoints"
// >;

/*
 * Creates a new rtk api that exposes endpoints and react hooks generated from trpc
 * types.
 */
export const createTRPCApi = <TRouter extends AnyRouter>(
  options: TRPCClientOptions<TRouter>,
) =>
  wrapApiToProxy({
    api: createRTKQueryApi({
      baseQuery: createTRPCBaseQuery(options),
      // We're injecting endpoints later with proxy, but need to cast them
      // beforehand for proper typings to be exposed to users
      endpoints: () =>
        ({}) as CreateEndpointDefinitions<TRouter, TRPCBaseQuery, "api", never>,
    }),
    useQueryFunction: false,
  });

/**
 * Generic type for api that has injectEndpoint method for run time injection and
 * endpoints for reading previously generated definitions.
 * @internal
 **/
type InjectableWithEndpoints = Pick<AnyApi, "endpoints" | "injectEndpoints">;

/*
 * Injects
 */
export const injectTRPCEndpointsToApi = <
  TRouter extends AnyRouter,
  ExistingApi extends InjectableWithEndpoints,
  // == "Save" the types needed to build up proper new api type to type variables ==
  // Current baseQuery from existing api
  BaseQuery extends
    BaseQueryFn = ExistingApi["endpoints"][keyof ExistingApi["endpoints"]]["Types"]["BaseQuery"],
  // Endpoints record values mapped to their inner definitions
  Endpoints = {
    [Endpoint in keyof ExistingApi["endpoints"]]: ExistingApi["endpoints"][Endpoint] extends ApiEndpointQuery<
      infer EndpointDefinition,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      any
    >
      ? EndpointDefinition
      : never;
  },
  // Reducer path
  ReducerPath extends
    string = ExistingApi["endpoints"][keyof ExistingApi["endpoints"]]["Types"]["ReducerPath"],
  // Tag types
  TagTypes extends
    string = ExistingApi["endpoints"][keyof ExistingApi["endpoints"]]["Types"]["TagTypes"],
>(
  options: TRPCClientOptions<TRouter> & {
    existingApi: ExistingApi;
  },
) =>
  wrapApiToProxy({
    api: options.existingApi as Api<
      BaseQuery,
      Endpoints & CreateEndpointDefinitions<TRouter, BaseQuery, ReducerPath, TagTypes>,
      ReducerPath,
      TagTypes,
      SupportedModule
    >,
    tRPCClientOptions: options,
    useQueryFunction: true,
  });
