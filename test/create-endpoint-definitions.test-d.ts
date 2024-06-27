import type { QueryKeys } from "@reduxjs/toolkit/query/react";

import { describe, expectTypeOf, it } from "vitest";

import type { CreateEndpointDefinitions } from "../src/create-endpoint-definitions.js";
import type { TRPCBaseQuery } from "../src/create-trpc-base-query.js";
import type { AppRouter } from "./fixtures.js";

describe("create endpoint definitions", () => {
  describe("for new api (with trpc base query)", () => {
    // Regression testing against wrong keys returned wrong QueryKeys type
    it("generates properly shaped return type that can be passed to rtk QueryKeys type helper", () => {
      type Definitions = CreateEndpointDefinitions<
        AppRouter,
        TRPCBaseQuery,
        "api",
        never
      >;
      expectTypeOf<QueryKeys<Definitions>>().not.toEqualTypeOf<never>();
    });
  });
});
