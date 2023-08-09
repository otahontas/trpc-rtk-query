// TODO: https://github.com/otahontas/trpc-rtk-query/issues/39
import { type CoreModule } from "@reduxjs/toolkit/dist/query/core/module";
import { type ReactHooksModule } from "@reduxjs/toolkit/dist/query/react/module";
import { type Api } from "@reduxjs/toolkit/query/react";

/**
 * RTK modules that are supported. Passed api needs to support these
 */
export type SupportedModule = CoreModule | ReactHooksModule;

/**
 * Generic api type that can be used as type constrain
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyApi = Api<any, Record<string, any>, any, any, SupportedModule>;
