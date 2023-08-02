import { type ApiEndpointQuery } from "@reduxjs/toolkit/dist/query/core/module"; // TODO: don't import from dist
import {
  type Api,
  type BaseQueryFn,
  type CreateApiOptions,
  createApi,
} from "@reduxjs/toolkit/query/react";
import { type AnyRouter } from "@trpc/server";

import {
  type BaseQueryForTRPCClient,
  createBaseQueryForTRPCClient,
} from "./create-base-query";
import { type CreateEndpointDefinitionsFromTRPCRouter } from "./create-endpoint-definitions";
import { type CreateTRPCApiClientOptions } from "./create-trpc-api-client-options";
import { Injectable, SupportedModule, wrapApiToProxy } from "./wrap-api-to-proxy";

// TODO: investigate why we need to use casting with { endpoints: Record... } here
type EndpointsObject = {
  // TODO: fix any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  endpoints: Record<string, any>;
};

// TODO: combine createTRPCApiWithRTKQueryApiOptions and createApi with function
// overloads?

type NonAllowedApiOptions = Extract<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keyof CreateApiOptions<any, any, any, any>,
  "baseQuery" | "endpoints"
>;

/*
 * Creates a new api, but allows passing in options for rtk query api.
 * Unfortunately this must be done via currying to allow partial inferring of type
 * arguments (i.e. you can pass AppRouter, but nothing else).
 * TODO: Fix when typescript supports partial type infering
 */
export const createTRPCApiWithRTKQueryApiOptions =
  <ReducerPath extends string, TagTypes extends string>(
    createApiOptions: Omit<
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      CreateApiOptions<BaseQueryForTRPCClient, any, ReducerPath, TagTypes>,
      NonAllowedApiOptions
    >,
  ) =>
  <TRouter extends AnyRouter>(options: CreateTRPCApiClientOptions<TRouter>) => {
    const nonProxyApi = createApi({
      ...createApiOptions,
      baseQuery: createBaseQueryForTRPCClient(options),
      // We're injecting endpoints later with proxy, but need to cast them
      // beforehand for proper typings to be exposed to users
      endpoints: () =>
        ({}) as CreateEndpointDefinitionsFromTRPCRouter<
          TRouter,
          BaseQueryForTRPCClient,
          "api",
          never
        >,
    });
    return wrapApiToProxy({
      nonProxyApi: nonProxyApi as typeof nonProxyApi & EndpointsObject, // TODO: fix endpoints cast
      useQueryFunction: false,
    });
  };

/*
 * Creates a new api using trpc under the hood
 */
export const createTRPCApi = <TRouter extends AnyRouter>(
  options: CreateTRPCApiClientOptions<TRouter>,
) => {
  const nonProxyApi = createApi({
    baseQuery: createBaseQueryForTRPCClient(options),
    // We're injecting endpoints later with proxy, but need to cast them
    // beforehand for proper typings to be exposed to users
    endpoints: () =>
      ({}) as CreateEndpointDefinitionsFromTRPCRouter<
        TRouter,
        BaseQueryForTRPCClient,
        "api",
        never
      >,
  });
  return wrapApiToProxy({
    nonProxyApi: nonProxyApi as typeof nonProxyApi & EndpointsObject, // TODO: fix endpoints cast
    useQueryFunction: false,
  });
};

// TODO: Allow passing in settings for api (reducerpath, tagtypes etc)
export type InjectTRPCEndpointsToApiOptions<
  TRouter extends AnyRouter,
  ExistingApi extends Injectable,
> = CreateTRPCApiClientOptions<TRouter> & {
  existingApi: ExistingApi;
};

export const injectTRPCEndpointsToApi = <
  TRouter extends AnyRouter,
  ExistingApi extends Injectable,
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
  options: InjectTRPCEndpointsToApiOptions<TRouter, ExistingApi>,
) => {
  // TODO: fix casting with { endpoints }
  const nonProxyApi = options.existingApi as unknown as Api<
    BaseQuery,
    Endpoints &
      CreateEndpointDefinitionsFromTRPCRouter<
        TRouter,
        BaseQuery,
        ReducerPath,
        TagTypes
      >,
    ReducerPath,
    TagTypes,
    SupportedModule
  > &
    EndpointsObject;

  return wrapApiToProxy({
    createTrpcApiClientOptions: options,
    nonProxyApi,
    useQueryFunction: true,
  });
};
