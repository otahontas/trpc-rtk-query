import { type CoreModule } from "@reduxjs/toolkit/query";
import { type Api, reactHooksModuleName } from "@reduxjs/toolkit/query/react";

/**
 * RTK modules that are supported. Passed api needs to support these
 */
export type SupportedModule = CoreModule | typeof reactHooksModuleName;

/**
 * Generic api type that can be used as type constrain
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyApi = Api<any, Record<string, any>, any, any, SupportedModule>;
