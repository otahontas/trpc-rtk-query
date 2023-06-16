import { configureStore } from "@reduxjs/toolkit";
import { type BaseQueryApi, skipToken } from "@reduxjs/toolkit/query";
import { type CreateTRPCProxyClient, createTRPCProxyClient } from "@trpc/client";
import { setTimeout } from "node:timers/promises";
import React from "react";
import { Provider } from "react-redux";
import renderer from "react-test-renderer";
import { beforeAll, describe, expect, expectTypeOf, it, vi } from "vitest";

import { type CreateTRPCApiOptions, createTRPCApi } from "../src/create-trpc-api";
import {
  type AppRouter,
  startTestServer,
  tRPCClientOptions,
  userFixtures,
} from "./fixtures";

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
export const createReactTestApp = (options: CreateTRPCApiOptions<AppRouter>) => {
  const api = createTRPCApi<AppRouter>(options);
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
  const preMadeClient = createTRPCProxyClient(tRPCClientOptions);
  const getClient = async (
    baseQueryApi: BaseQueryApi,
  ): Promise<CreateTRPCProxyClient<AppRouter>> => {
    // Check that correct apiArgs object is passed
    expect(baseQueryApi.type).toBeDefined();
    expect(baseQueryApi.endpoint).toBeDefined();
    // Return proxy client
    return createTRPCProxyClient(tRPCClientOptions);
  };

  it("prevents passing in mutually exclusive args", () => {
    // @ts-expect-error Should not be possible to pass both client and clientOptions
    createTRPCApi<AppRouter>({
      client: preMadeClient,
      clientOptions: tRPCClientOptions,
    });

    // @ts-expect-error Should not be possible to pass both client and getClient
    createTRPCApi<AppRouter>({
      client: preMadeClient,
      getClient,
    });

    // @ts-expect-error Should not be possible to pass both getClient and clientOptions
    createTRPCApi<AppRouter>({
      clientOptions: tRPCClientOptions,
      getClient,
    });
  });

  describe.each([
    {
      createApiOptions: { clientOptions: tRPCClientOptions },
      testCase: "creating client from clientOptions",
    },
    {
      createApiOptions: { client: preMadeClient },
      testCase: "using passed client",
    },
    {
      createApiOptions: { getClient },
      testCase: "using getClient to get the client",
    },
  ])("when $testCase", ({ createApiOptions }) => {
    it("Generates an api instance", () => {
      const api = createTRPCApi<AppRouter>(createApiOptions);
      expect(api).toBeDefined();
    });

    it("Generates queries with correct typings", () => {
      const api = createTRPCApi<AppRouter>(createApiOptions);
      const { useGetUserByIdQuery, useListUsersQuery } = api;

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
      const api = createTRPCApi<AppRouter>(createApiOptions);
      const { useCreateUserMutation, useUpdateNameMutation } = api;

      expect(useUpdateNameMutation).toBeDefined();
      expect(useCreateUserMutation).toBeDefined();
      expectTypeOf(useUpdateNameMutation).toBeFunction();
      expectTypeOf(useCreateUserMutation).toBeFunction();
      type UseUpdateNameMutationTriggerArgument = Parameters<
        ReturnType<typeof useUpdateNameMutation>[0]
      >[0];
      type UseUserCreateMutationTriggerArgument = Parameters<
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
        Assert<Equals<UseUserCreateMutationTriggerArgument, string>>,
        // @ts-expect-error Should not be possible to pass number here
        Assert<Equals<UseUserCreateMutationTriggerArgument, number>>,
      ];
    });

    it.each([
      "useQuery",
      "useQueryState",
      "useQuerySubscription",
      "useLazyQuery",
      "useLazyQuerySubscription",
    ] as const)(
      "Generates %s hook when accessing hooks through endpoints[endpoint] property",
      (queryName) => {
        const api = createTRPCApi<AppRouter>(createApiOptions);
        const query = api.endpoints.getUserById[queryName];
        expect(query).toBeDefined();
        expectTypeOf(query).toBeFunction();
      },
    );

    it("Generates defined usePrefetch with typings", () => {
      const api = createTRPCApi<AppRouter>(createApiOptions);
      const { usePrefetch } = api;
      expect(usePrefetch).toBeDefined();
      expectTypeOf(usePrefetch).toBeFunction();
      expectTypeOf(usePrefetch)
        .parameter(0)
        .toMatchTypeOf<
          "getUserById" | "listUsers" | "nested_Deep_GetVeryNestedMessage"
        >();
    });

    it("Generates hooks for deeply nested routes", () => {
      const api = createTRPCApi<AppRouter>(createApiOptions);
      const { useNested_Deep_GetVeryNestedMessageQuery } = api;
      expect(useNested_Deep_GetVeryNestedMessageQuery).toBeDefined();
      expectTypeOf(useNested_Deep_GetVeryNestedMessageQuery).toBeFunction();
      expectTypeOf(useNested_Deep_GetVeryNestedMessageQuery)
        .parameter(0)
        .toMatchTypeOf<{ deepInput: string } | typeof skipToken>();
    });

    it("Generates hooks for deeply nested routes through endpoints[endpoint]", () => {
      const api = createTRPCApi<AppRouter>(createApiOptions);
      const query = api.endpoints.nested_Deep_GetVeryNestedMessage.useQuerySubscription;
      expect(query).toBeDefined();
      expectTypeOf(query).toBeFunction();
    });

    describe("and making actual requests with hooks renders correctly", () => {
      // how much to wait for loading state to resolve
      // TODO: fix with using actual rerender with waitFor from testing-library
      const msToWaitBeforeRenderingWithoutLoadingState = 100;
      beforeAll(async () => {
        const { close } = await startTestServer();
        return async () => await close();
      });

      it("with successful useUserIdQuery", async () => {
        const { api, createComponentWrapper } = createReactTestApp(createApiOptions);
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

        await setTimeout(msToWaitBeforeRenderingWithoutLoadingState);
        expect(result).toMatchSnapshot();
        // This render needs a bit more time for getClient case, I guess because of
        // forming queryClient takes a bit more time
        // TODO: plz fix with waitFor or something

        // result after data has loaded and component has re-rendered
        result = renderedToJSon(app);
        expect(JSON.stringify(result)).not.toContain("Loading...");
        expect(JSON.stringify(result)).not.toContain("Error");
        expect(result).toMatchSnapshot();
      });

      it("with failing useUserIdQuery", async () => {
        const { api, createComponentWrapper } = createReactTestApp(createApiOptions);
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
        await setTimeout(msToWaitBeforeRenderingWithoutLoadingState);
        // result after data has loaded and component has re-rendered
        result = renderedToJSon(app);
        expect(JSON.stringify(result)).not.toContain("Loading...");
        expect(JSON.stringify(result)).toContain("Error");
        expect(result).toMatchSnapshot();
      });

      it("with successful deep nested query", async () => {
        const { api, createComponentWrapper } = createReactTestApp(createApiOptions);
        const Component = () => {
          const { useNested_Deep_GetVeryNestedMessageQuery } = api;
          const myInput = "heyoooo";
          const { data, error, isLoading } = useNested_Deep_GetVeryNestedMessageQuery({
            deepInput: myInput,
          });
          if (isLoading) {
            return <div>Loading...</div>;
          }
          if (error || !data) {
            return <div>Error</div>;
          }
          expect(data.inputBack).toStrictEqual(myInput);
          return (
            <div>
              <p>inputBack: {data.inputBack}</p>
              <p>messageFromDeep: {data.messageFromDeep}</p>
            </div>
          );
        };
        const app = createComponentWrapper(Component);
        // first render
        let result = renderedToJSon(app);
        expect(result).toMatchSnapshot();
        await setTimeout(msToWaitBeforeRenderingWithoutLoadingState);
        // result after data has loaded and component has re-rendered
        result = renderedToJSon(app);
        expect(JSON.stringify(result)).not.toContain("Loading...");
        expect(JSON.stringify(result)).not.toContain("Error");
        expect(result).toMatchSnapshot();
      });

      it("with call to usePrefetch", async () => {
        const { api, createComponentWrapper } = createReactTestApp(createApiOptions);
        const userId = 1;
        const PrefetcherComponent = () => {
          const { usePrefetch } = api;
          const prefetch = usePrefetch("getUserById");
          expect(prefetch).toBeDefined();
          prefetch(userId);
          return <>prefetched</>;
        };
        const QueryComponent = () => {
          const { useQueryState } = api.endpoints.getUserById;
          const { data } = useQueryState(userId);
          expect(data).toEqual(userFixtures[1]);
          return (
            <div>
              <p>Id: {data!.id}</p>
              <p>Name: {data!.name}</p>
            </div>
          );
        };

        const Parent = () => {
          const [showQueryComponent, setShowQueryComponent] = React.useState(false);

          const handleMouseEnter = () => {
            setShowQueryComponent(true);
          };

          return (
            <div onMouseEnter={handleMouseEnter}>
              {showQueryComponent ? <QueryComponent /> : <PrefetcherComponent />}
            </div>
          );
        };

        // render prefetcher component
        const component = createComponentWrapper(Parent);
        let result = renderedToJSon(component);
        expect(JSON.stringify(result)).toContain("prefetched");
        expect(result).toMatchSnapshot();

        // wait for data to load
        await setTimeout(msToWaitBeforeRenderingWithoutLoadingState);
        // manually trigger the callback
        result.props["onMouseEnter"]();
        // render query component and check that prefetch was actually called
        // properly through proxy (e.g. query state should be loaded)
        result = renderedToJSon(component);
        expect(JSON.stringify(result)).not.toContain("Error");
        expect(JSON.stringify(result)).toContain("Id");
        expect(JSON.stringify(result)).toContain("Name");
        expect(result).toMatchSnapshot();
      });

      it("does not inject endpoints again", async () => {
        const { api, createComponentWrapper } = createReactTestApp(createApiOptions);

        // Try to listen error log from rtk
        const consoleErrorMock = vi
          .spyOn(console, "error")
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          .mockImplementation(() => {});

        const FirstComponent = () => {
          const { useListUsersQuery } = api;
          const { data } = useListUsersQuery();
          return <>{JSON.stringify(data)}</>;
        };
        const SecondComponent = () => {
          const { useListUsersQuery } = api;
          const { data } = useListUsersQuery();
          return <>{JSON.stringify(data)}</>;
        };

        const Parent = () => {
          return (
            <>
              <FirstComponent />
              <SecondComponent />
            </>
          );
        };
        const app = createComponentWrapper(Parent);
        // first render
        renderedToJSon(app);
        expect(consoleErrorMock).not.toHaveBeenCalled();
      });
    });
  });
});
