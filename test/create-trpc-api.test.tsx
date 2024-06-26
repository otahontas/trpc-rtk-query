import { configureStore } from "@reduxjs/toolkit";
import { type BaseQueryApi, createApi } from "@reduxjs/toolkit/query/react";
import { createTRPCProxyClient } from "@trpc/client";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { setTimeout } from "node:timers/promises";
import React from "react";
import { Provider } from "react-redux";
import renderer from "react-test-renderer";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { enhanceApi } from "../src/index.js";
import {
  type AppRouter,
  appRouter,
  testClientOptions,
  testPort,
  userFixtures,
} from "./fixtures.js";

type TestServer = {
  close: () => Promise<void>;
};

export const startTestServer = (): Promise<TestServer> =>
  new Promise((resolveCreate) => {
    const { server } = createHTTPServer({
      router: appRouter,
    });

    const closePromise = (): Promise<void> =>
      new Promise((resolveClose, rejectClose) => {
        server.close((error) => {
          if (error) {
            console.error("Failed to close test server!");
            rejectClose(error);
            return;
          }
          resolveClose();
        });
      });

    server.listen(testPort, () => {
      console.log("Test server listening!");
      resolveCreate({
        close: closePromise,
      });
    });
  });

// helper for rendering component to json for snapshots
const renderedToJSon = (component: renderer.ReactTestRenderer) => {
  const result = component.toJSON();
  expect(result).toBeDefined();
  expect(result).not.toBeInstanceOf(Array);
  return result as renderer.ReactTestRendererJSON;
};

// Client side options that can be passed in when testing
const existingApiTestQueryArgument = "giveMeData";
const existingApiTestQuerySuccessResponse = {
  returning: "data",
};
const existingApiTestQueryFailureResponse = {
  error: "bad stuff happened",
};

// helper that allows creating new api instances when needed
const createRTKQueryApiLazily = () =>
  createApi({
    baseQuery: (baseQueryArguments: { getResponseArgument: string }) => {
      if (baseQueryArguments.getResponseArgument !== existingApiTestQueryArgument) {
        return existingApiTestQueryFailureResponse;
      }
      return {
        data: existingApiTestQuerySuccessResponse,
      };
    },
    endpoints: (builder) => ({
      getResponse: builder.query<string, string>({
        query: (getResponseArgument: string) => ({
          getResponseArgument,
        }),
      }),
    }),
  });

describe("create-trpc-api with pre made api ", () => {
  describe.each([
    {
      getApi: () =>
        enhanceApi({
          api: createRTKQueryApiLazily(),
          client: createTRPCProxyClient<AppRouter>(testClientOptions),
        }),
      testCase: "using passed client",
    },
    {
      getApi: () =>
        enhanceApi({
          api: createRTKQueryApiLazily(),
          getClient: async (baseQueryApi: BaseQueryApi) => {
            // Check that correct apiArgs object is passed
            expect(baseQueryApi.type).toBeDefined();
            expect(baseQueryApi.endpoint).toBeDefined();

            // Return proxy client
            return createTRPCProxyClient<AppRouter>(testClientOptions);
          },
        }),
      testCase: "using getClient to get the client",
    },
  ])("when $testCase", ({ getApi }) => {
    it("Generates an api instance", () => {
      const api = getApi();
      expect(api).toBeDefined();
    });

    it("Generates queries", () => {
      const api = getApi();
      const { useGetUserByIdQuery, useListUsersQuery } = api;
      expect(useGetUserByIdQuery).toBeDefined();
      expect(useListUsersQuery).toBeDefined();
    });

    it("Generates mutations", () => {
      const api = getApi();
      const { useCreateUserMutation, useUpdateNameMutation } = api;
      expect(useUpdateNameMutation).toBeDefined();
      expect(useCreateUserMutation).toBeDefined();
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
        const api = getApi();
        const query = api.endpoints.getUserById[queryName];
        expect(query).toBeDefined();
      },
    );

    it("Generates usePrefetch", () => {
      const api = getApi();
      const { usePrefetch } = api;
      expect(usePrefetch).toBeDefined();
    });

    it("Generates hook for deeply nested route", () => {
      const api = getApi();
      const { useNested_Deep_GetVeryNestedMessageQuery } = api;
      expect(useNested_Deep_GetVeryNestedMessageQuery).toBeDefined();
    });

    it("Generates hook for deeply nested routes through endpoints[endpoint]", () => {
      const api = getApi();
      const query = api.endpoints.nested_Deep_GetVeryNestedMessage.useQuerySubscription;
      expect(query).toBeDefined();
    });

    describe("and making actual requests with hooks renders correctly", () => {
      // Create react app for testing. Keeping this in scope so it's easier to type.
      const createReactTestApp = (getApiForStore: typeof getApi) => {
        const api = getApiForStore();
        const store = configureStore({
          middleware: (getDefaultMiddleware) =>
            // eslint-disable-next-line unicorn/prefer-spread
            getDefaultMiddleware().concat(api.middleware),
          reducer: {
            [api.reducerPath]: api.reducer,
          },
        });

        const createComponentWrapper = (Component: () => JSX.Element) =>
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

      // how much to wait for loading state to resolve
      const msToWaitBeforeRenderingWithoutLoadingState = 150;

      beforeAll(async () => {
        const { close } = await startTestServer();
        console.log("waiting a bit before running integration tests");
        await setTimeout(250);
        return () => close();
      });

      it("with successful useUserIdQuery", async () => {
        const { api, createComponentWrapper } = createReactTestApp(getApi);
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
        result = renderedToJSon(app);
        expect(JSON.stringify(result)).not.toContain("Loading...");
        expect(JSON.stringify(result)).not.toContain("Error");
        expect(result).toMatchSnapshot();
      });

      it("with failing useUserIdQuery", async () => {
        const { api, createComponentWrapper } = createReactTestApp(getApi);
        const Component = () => {
          const { useGetUserByIdQuery } = api;
          const userId = 4;
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
        const { api, createComponentWrapper } = createReactTestApp(getApi);
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
        const { api, createComponentWrapper } = createReactTestApp(getApi);
        const userId = 1;
        const PrefetcherComponent = () => {
          const { usePrefetch } = api;
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore ignore for now, for runtime testing. Fix type later
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
        const { api, createComponentWrapper } = createReactTestApp(getApi);
        // Try to listen error log from rtk
        const consoleErrorMock = vi
          .spyOn(console, "error")
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

    it("Can be extended with enchangeEndpoints", () => {
      const api = getApi();
      expect(api.enhanceEndpoints).toBeDefined();

      // Running this to make sure we haven't broken anything api side
      api.enhanceEndpoints({
        addTagTypes: ["User"],
        endpoints: {
          getUserById: {
            onQueryStarted() {},
            providesTags: ["User"],
          },
          updateName: {
            onQueryStarted() {},
          },
        },
      });
    });
  });

  it("doesn't replace previous hooks when passing in and existing api", () => {
    const client = createTRPCProxyClient<AppRouter>(testClientOptions);
    const api = enhanceApi({
      api: createRTKQueryApiLazily(),
      client,
    });
    const { useListUsersQuery } = api;
    expect(useListUsersQuery).toBeDefined();
    const { useGetResponseQuery } = api;
    expect(useGetResponseQuery).toBeDefined();
  });
});
