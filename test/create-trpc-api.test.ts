import { describe, expect, it } from "vitest";

import type { FlatAppRouter } from "./fixtures";

import { createTRPCApi } from "../src/create-trpc-api";
import { tRPCClientOptions } from "./fixtures";

describe("create-trpc-api", () => {
  it("Generates an api instance", () => {
    const api = createTRPCApi<FlatAppRouter>(tRPCClientOptions);
    expect(api).toBeDefined();
  });
  it("Generates 1st level queries", () => {
    const api = createTRPCApi<FlatAppRouter>(tRPCClientOptions);
    expect(api.useUserListQuery).toBeDefined();
    expect(api.useUserByIdQuery).toBeDefined();
  });
  it("Generates 2st level mutations", () => {
    const api = createTRPCApi<FlatAppRouter>(tRPCClientOptions);
    expect(api.useUserCreateMutation).toBeDefined();
    expect(api.useUpdateNameMutation).toBeDefined();
  });
});
