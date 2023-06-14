import { configureStore } from "@reduxjs/toolkit";
import { skipToken } from "@reduxjs/toolkit/query";
import { setTimeout } from "node:timers/promises";
import React from "react";
import { Provider } from "react-redux";
import renderer from "react-test-renderer";
import { beforeAll, describe, expect, expectTypeOf, it } from "vitest";

import type { FlatAppRouter } from "./fixtures";

import { createTRPCApi } from "../src/create-trpc-api";
import { startTestServer, userFixtures } from "./fixtures";
import { tRPCClientOptions } from "./fixtures";

// Type level helper, use for testing when vitest isn't flexible enough
export type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
  ? 1
  : 2
  ? true
  : false;
export type Assert<T extends true> = T extends true ? true : false;

// render component to string for snapshots
export const renderedToJSon = (component: renderer.ReactTestRenderer) => {
  const result = component.toJSON();
  expect(result).toBeDefined();
  expect(result).not.toBeInstanceOf(Array);
  return result as renderer.ReactTestRendererJSON;
};

// generate api store and app creator for testing hooks
export const createReactTestApp = () => {
  const api = createTRPCApi<FlatAppRouter>(tRPCClientOptions);
  const store = configureStore({
    middleware: (getDefaultMiddleware) => [...getDefaultMiddleware(), api.middleware],
    reducer: {
      [api.reducerPath]: api.reducer,
    },
  });

  const createComponentWrapper = (Component: () => React.JSX.Element) =>
    renderer.create(
      <Provider store={store}>
        <Component />
      </Provider>,
    );
  return {
    api,
    createComponentWrapper,
    store,
  };
};

describe("create-trpc-api", () => {
  it("Generates an api instance", () => {
    const api = createTRPCApi<FlatAppRouter>(tRPCClientOptions);
    expect(api).toBeDefined();
  });

  it("Generates queries with correct typings", () => {
    const { useGetUserByIdQuery, useListUsersQuery } =
      createTRPCApi<FlatAppRouter>(tRPCClientOptions);

    expect(useGetUserByIdQuery).toBeDefined();
    expectTypeOf(useGetUserByIdQuery).toBeFunction();
    expectTypeOf(useGetUserByIdQuery)
      .parameter(0)
      .toMatchTypeOf<number | typeof skipToken>();
    expect(useListUsersQuery).toBeDefined();
    expectTypeOf(useListUsersQuery).toBeFunction();
    expectTypeOf(useListUsersQuery)
      .parameter(0)
      .toMatchTypeOf<typeof skipToken | void>();
  });

  it("Generates mutations with correct typings", () => {
    const { useCreateUserMutation, useUpdateNameMutation } =
      createTRPCApi<FlatAppRouter>(tRPCClientOptions);

    expect(useUpdateNameMutation).toBeDefined();
    expect(useCreateUserMutation).toBeDefined();
    expectTypeOf(useUpdateNameMutation).toBeFunction();
    expectTypeOf(useCreateUserMutation).toBeFunction();
    type UseUpdateNameMutationTriggerArgument = Parameters<
      ReturnType<typeof useUpdateNameMutation>[0]
    >[0];
    type useUserCreateMutationTriggerArgument = Parameters<
      ReturnType<typeof useCreateUserMutation>[0]
    >[0];
    // @ts-expect-error _tests is unused
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

  it.each([
    "useQuery",
    "useMutation",
    "useQueryState",
    "useQuerySubscription",
    "useLazyQuery",
    "useLazyQuerySubscription",
  ])(
    "Generates %s hook when accessing hooks through endpoints[endpoint] property",
    () => {
      const api = createTRPCApi<FlatAppRouter>(tRPCClientOptions);
      const query = api.endpoints.getUserById.useQuery;
      expect(query).toBeDefined();
      expectTypeOf(query).toBeFunction();
    },
  );

  it("Generates defined usePrefetch with typings", () => {
    const { usePrefetch } = createTRPCApi<FlatAppRouter>(tRPCClientOptions);
    expect(usePrefetch).toBeDefined();
    expectTypeOf(usePrefetch).toBeFunction();
    expectTypeOf(usePrefetch).parameter(0).toMatchTypeOf<"getUserById" | "listUsers">();
  });
});

describe("making actual requests with hooks renders correctly", () => {
  beforeAll(async () => {
    const { close } = await startTestServer();
    return close;
  });

  it("with successful useUserIdQuery", async () => {
    const { api, createComponentWrapper } = createReactTestApp();
    const Component = () => {
      const { useGetUserByIdQuery } = api;
      const userId = 1;
      const { data, error, isLoading } = useGetUserByIdQuery(userId);
      if (isLoading) {
        return <div>Loading...</div>;
      }
      if (error || !data) {
        return <div>Error</div>;
      }
      expect(data).toEqual(userFixtures[1]);
      return (
        <div>
          <p>Id: {data.id}</p>
          <p>Name: {data.name}</p>
        </div>
      );
    };
    const app = createComponentWrapper(Component);
    // first render
    let result = renderedToJSon(app);
    expect(result).toMatchSnapshot();
    await setTimeout(500);
    // result after data has loaded and component has re-rendered
    result = renderedToJSon(app);
    expect(result).toMatchSnapshot();
  });

  it("with failing useUserIdQuery", async () => {
    const { api, createComponentWrapper } = createReactTestApp();
    const Component = () => {
      const { useGetUserByIdQuery } = api;
      const userId = 4;
      // TODO: errors should be properly typed from basequery!
      const { data, error, isLoading } = useGetUserByIdQuery(userId);
      if (isLoading) {
        return <div>Loading...</div>;
      }
      if (error || !data) {
        return <div>Error</div>;
      }
      expect(data).toEqual(userFixtures[1]);
      return (
        <div>
          <p>Id: {data.id}</p>
          <p>Name: {data.name}</p>
        </div>
      );
    };
    const app = createComponentWrapper(Component);
    // first render
    let result = renderedToJSon(app);
    expect(result).toMatchSnapshot();
    await setTimeout(500);
    // result after data has loaded and component has re-rendered
    result = renderedToJSon(app);
    expect(result).toMatchSnapshot();
  });

  it("with call to usePrefetch", async () => {
    const { api, createComponentWrapper } = createReactTestApp();
    // TODO: test that prefetching is actually called and it populates correctly!
    const Component = () => {
      const { usePrefetch } = api;
      const userId = 1;
      const prefetch = usePrefetch("getUserById");
      expect(prefetch).toBeDefined();
      prefetch(userId);
      return <>prefetched</>;
    };
    const app = createComponentWrapper(Component);
    // first render
    const result = renderedToJSon(app);
    expect(result).toMatchSnapshot();
  });
});
