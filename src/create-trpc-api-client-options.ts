import { type BaseQueryApi } from "@reduxjs/toolkit/query/react";
import { type CreateTRPCClientOptions, type CreateTRPCProxyClient } from "@trpc/client";
import { type AnyRouter } from "@trpc/server";

/**
 * Client specific options when creating trpc api. You can either
 *  - pass in already created proxy client
 *  - pass in client options, so client is created for you
 *  - pass in callback that gets access to BaseQueryApi from RTK. This is useful for example when you need to access redux store when creating the client.
 **/
export type CreateTRPCApiClientOptions<TRouter extends AnyRouter> =
  | {
      client: CreateTRPCProxyClient<TRouter>;
      clientOptions?: never;
      getClient?: never;
    }
  | {
      client?: never;
      clientOptions: CreateTRPCClientOptions<TRouter>;
      getClient?: never;
    }
  | {
      client?: never;
      clientOptions?: never;
      getClient: (
        baseQueryApi: BaseQueryApi,
      ) => Promise<CreateTRPCProxyClient<TRouter>>;
    };
