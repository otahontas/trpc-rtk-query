import { skipToken } from "@reduxjs/toolkit/dist/query";
import { describe, expect, expectTypeOf, it } from "vitest";

import type { FlatAppRouter } from "./fixtures";
import type { Assert, Equals } from "./helpers";

import { createTRPCApi } from "../src/create-trpc-api";
import { tRPCClientOptions } from "./fixtures";

describe("create-trpc-api", () => {
  it("Generates an api instance", () => {
    const api = createTRPCApi<FlatAppRouter>(tRPCClientOptions);
    expect(api).toBeDefined();
  });

  it("Generates 1st level queries with correct typings", () => {
    const { useUserByIdQuery, useUserListQuery } =
      createTRPCApi<FlatAppRouter>(tRPCClientOptions);

    expect(useUserByIdQuery).toBeDefined();
    expectTypeOf(useUserByIdQuery).toBeFunction();
    expectTypeOf(useUserByIdQuery)
      .parameter(0)
      .toMatchTypeOf<number | typeof skipToken>();
    expect(useUserListQuery).toBeDefined();
    expectTypeOf(useUserListQuery).toBeFunction();
    expectTypeOf(useUserListQuery)
      .parameter(0)
      .toMatchTypeOf<typeof skipToken | void>();
  });

  it("Generates 1st level mutations with correct typings", () => {
    const { useUpdateNameMutation, useUserCreateMutation } =
      createTRPCApi<FlatAppRouter>(tRPCClientOptions);

    expect(useUpdateNameMutation).toBeDefined();
    expect(useUserCreateMutation).toBeDefined();
    expectTypeOf(useUpdateNameMutation).toBeFunction();
    expectTypeOf(useUserCreateMutation).toBeFunction();
    type UseUpdateNameMutationTriggerArgument = Parameters<
      ReturnType<typeof useUpdateNameMutation>[0]
    >[0];
    type useUserCreateMutationTriggerArgument = Parameters<
      ReturnType<typeof useUserCreateMutation>[0]
    >[0];
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    type _tests = [
      Assert<
        Equals<UseUpdateNameMutationTriggerArgument, { id: number; name: string }>
      >,
      Assert<
        // @ts-expect-error Argument is required
        Equals<UseUpdateNameMutationTriggerArgument, never>
      >,
      Assert<Equals<useUserCreateMutationTriggerArgument, string>>,
      // @ts-expect-error Should not be possible to pass number here
      Assert<Equals<useUserCreateMutationTriggerArgument, number>>,
    ];
  });
});
