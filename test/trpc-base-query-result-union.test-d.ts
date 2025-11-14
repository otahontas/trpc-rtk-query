import { describe, expectTypeOf, it } from "vitest";

import type { TRPCBaseQuery } from "../src/create-trpc-base-query.js";
import type { AppRouter } from "./fixtures.js";

describe("TRPCBaseQuery result type union", () => {
  it("should be properly typed as a generic base query function", () => {
    type BaseQuery = TRPCBaseQuery<AppRouter>;

    // Should be a function type
    type IsFunction = BaseQuery extends (...args: any[]) => any
      ? true
      : false;
    expectTypeOf<IsFunction>().toEqualTypeOf<true>();
  });

  it("should infer result type from router procedures", () => {
    type BaseQuery = TRPCBaseQuery<AppRouter>;

    // The result type should be inferred from all procedures in the router
    // Extract the data type from the base query return type
    type ResultType = BaseQuery extends (
      ...args: any[]
    ) => Promise<{ data: infer R } | { error: any }>
      ? R
      : never;

    // The result type should not be never - it should be the union of procedure outputs
    expectTypeOf<ResultType>().not.toBeAny();
  });

  it("should properly type the base query return value as a discriminated union", () => {
    type BaseQuery = TRPCBaseQuery<AppRouter>;
    type BaseQueryReturnType = Awaited<ReturnType<BaseQuery>>;

    // The return type should be a discriminated union
    expectTypeOf<BaseQueryReturnType>().toMatchTypeOf<
      | { data: any; error?: undefined }
      | { error: any; data?: undefined }
    >();
  });

  it("should allow type narrowing based on error presence", () => {
    type BaseQuery = TRPCBaseQuery<AppRouter>;
    type BaseQueryReturnType = Awaited<ReturnType<BaseQuery>>;

    // Verify discriminated union structure
    const result = {} as BaseQueryReturnType;

    if ("error" in result && result.error !== undefined) {
      // In error case, error should be defined
      expectTypeOf(result.error).not.toBeNever();
      // And data should be undefined
      expectTypeOf(result.data).toEqualTypeOf<undefined>();
    } else {
      // In success case, data should be defined
      expectTypeOf(result.data).not.toBeNever();
      // And error should be undefined
      expectTypeOf(result.error).toEqualTypeOf<undefined>();
    }
  });

  it("should have proper error types with discriminant status field", () => {
    type BaseQuery = TRPCBaseQuery<AppRouter>;
    type BaseQueryReturnType = Awaited<ReturnType<BaseQuery>>;
    type ErrorReturn = Extract<BaseQueryReturnType, { error: any }>;

    // Error should have the proper structure
    expectTypeOf<ErrorReturn["error"]>().toMatchTypeOf<{
      status: "TRPC_CLIENT_ERROR" | "TRPC_ERROR" | "UNKNOWN_ERROR";
    }>();
  });

  it("should work with default generic parameter", () => {
    // TRPCBaseQuery without type parameter should use AnyRouter as default
    type DefaultBaseQuery = TRPCBaseQuery;

    // Should be a function type
    type IsFunction = DefaultBaseQuery extends (...args: any[]) => any
      ? true
      : false;
    expectTypeOf<IsFunction>().toEqualTypeOf<true>();
  });
});
