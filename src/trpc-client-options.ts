import { type BaseQueryApi } from "@reduxjs/toolkit/query/react";
import { type CreateTRPCClient } from "@trpc/client";
import { type AnyRouter } from "@trpc/server";

/**
 * TRPC client specific options when creating rtk api. You can either
 *  - pass in already created client or
 *  - pass in callback that gets access to BaseQueryApi from RTK. This is useful for example when you need to access redux store when creating the client. You can return the client as promise.
 **/
export type TRPCClientOptions<TRouter extends AnyRouter> =
  | {
      client: CreateTRPCClient<TRouter>;
      getClient?: never;
    }
  | {
      client?: never;
      getClient: (
        baseQueryApi: BaseQueryApi,
      ) => Promise<CreateTRPCClient<TRouter>>;
    };
