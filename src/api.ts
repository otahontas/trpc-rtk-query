import { type ApiEndpointQuery } from "@reduxjs/toolkit/query";
import {
  type Api,
  type BaseQueryFn,
  type EndpointDefinitions,
  type FullTagDescription,
  type MutationDefinition,
  type QueryDefinition,
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
 * Extract TagTypes from an API's endpoint Types
 * @internal
 **/
type ExtractTagTypes<TApi extends InjectableWithEndpoints> =
  TApi["endpoints"] extends Record<string, { Types: { TagTypes: infer TTag extends string } }>
    ? TTag
    : never;

/**
 * Tag description type that can be either a string tag or an object with type and id.
 * This is constrained to only allow tag types that are in the TagTypes union.
 * @internal
 **/
type StrictTagDescription<TagTypes extends string> = TagTypes | { type: TagTypes; id?: number | string };

/**
 * Result description for query providesTags - either an array or a function returning an array.
 * This enforces that all tags must be from the valid TagTypes union.
 * @internal
 **/
type QueryProvidesTags<
  TagTypes extends string,
  ResultType,
  QueryArg,
> =
  | ReadonlyArray<StrictTagDescription<TagTypes>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | ((result: ResultType | undefined, error: any | undefined, arg: QueryArg) => ReadonlyArray<StrictTagDescription<TagTypes>>);

/**
 * Result description for mutation invalidatesTags - either an array or a function returning an array.
 * This enforces that all tags must be from the valid TagTypes union.
 * @internal
 **/
type MutationInvalidatesTags<
  TagTypes extends string,
  ResultType,
  QueryArg,
> =
  | ReadonlyArray<StrictTagDescription<TagTypes>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | ((result: ResultType | undefined, error: any | undefined, arg: QueryArg) => ReadonlyArray<StrictTagDescription<TagTypes>>);

/**
 * Helper type to constrain endpoint options to use valid tag types.
 * This completely replaces providesTags/invalidatesTags with strictly typed versions.
 * @internal
 **/
type ConstrainedEndpointOptions<
  EndpointDef,
  TagTypes extends string,
> = EndpointDef extends QueryDefinition<infer QueryArg, infer BaseQuery, infer _OriginalTagTypes, infer ResultType, infer ReducerPath>
  ? Omit<EndpointDef, DisabledEndpointOptions | "providesTags" | "invalidatesTags"> & {
      providesTags?: QueryProvidesTags<TagTypes, ResultType, QueryArg>;
      invalidatesTags?: never;
    }
  : EndpointDef extends MutationDefinition<infer QueryArg, infer BaseQuery, infer _OriginalTagTypes, infer ResultType, infer ReducerPath>
    ? Omit<EndpointDef, DisabledEndpointOptions | "providesTags" | "invalidatesTags"> & {
        invalidatesTags?: MutationInvalidatesTags<TagTypes, ResultType, QueryArg>;
        providesTags?: never;
      }
    : Omit<EndpointDef, DisabledEndpointOptions>;

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
  // 4. Tag types - use explicit extraction
  TagTypes extends string = ExtractTagTypes<ExistingApi>,
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
      [K in keyof NewDefinitions]?: ConstrainedEndpointOptions<NewDefinitions[K], TagTypes>;
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

/*
 * Helper to create base api with no endpoints
 */
export const createEmptyApi = () =>
  createApi({
    baseQuery: () => ({ data: undefined }),
    endpoints: () => ({}),
  });
