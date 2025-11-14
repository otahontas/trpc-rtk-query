import { configureStore } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query/react";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { setTimeout } from "node:timers/promises";
import React from "react";
import { Provider } from "react-redux";
import renderer from "react-test-renderer";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { type TRPCBaseQueryError, enhanceApi } from "../src/index.js";
import { type AppRouter, appRouter, testPort } from "./fixtures.js";

// Use a different port to avoid conflicts with other tests
const errorTestPort = testPort + 1;
const errorTestClientOptions = {
  links: [httpBatchLink({ url: `http://localhost:${errorTestPort}` })],
};

type TestServer = {
  close: () => Promise<void>;
};

const startTestServer = (): Promise<TestServer> =>
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

    server.listen(errorTestPort, () => {
      resolveCreate({
        close: closePromise,
      });
    });
  });

const msToWaitBeforeRenderingWithoutLoadingState = 500;

describe("error handling", () => {
  let server: TestServer;

  beforeAll(async () => {
    server = await startTestServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it("should return properly typed errors for server-side errors", async () => {
    const client = createTRPCProxyClient<AppRouter>(errorTestClientOptions);
    const api = enhanceApi({
      api: createApi({
        baseQuery: () => ({ data: undefined }),
        endpoints: () => ({}),
        reducerPath: "api",
      }),
      client,
    });

    const store = configureStore({
      middleware: (getDefaultMiddleware) => [...getDefaultMiddleware(), api.middleware],
      reducer: {
        [api.reducerPath]: api.reducer,
      },
    });

    const Component = () => {
      const { useGetUserByIdQuery } = api;
      // User ID 999 doesn't exist, will trigger NOT_FOUND error
      const { data, error, isLoading } = useGetUserByIdQuery(999);

      if (isLoading) {
        return <div>Loading...</div>;
      }

      if (error) {
        // Verify error structure matches TRPCBaseQueryError
        const typedError = error as TRPCBaseQueryError;

        // tRPC errors thrown on server are caught by client and wrapped as TRPC_CLIENT_ERROR
        if (typedError.status === "TRPC_CLIENT_ERROR") {
          return (
            <div>
              <div>Error Status: {typedError.status}</div>
              <div>Error Message: {typedError.message}</div>
              <div>Error Name: {typedError.name}</div>
            </div>
          );
        }

        if (typedError.status === "TRPC_ERROR") {
          return (
            <div>
              <div>Error Status: {typedError.status}</div>
              <div>Error Message: {typedError.message}</div>
              <div>Error Name: {typedError.name}</div>
              <div>Status Code: {typedError.statusCode}</div>
            </div>
          );
        }

        return <div>Unexpected error type: {typedError.status}</div>;
      }

      if (!data) {
        return <div>No data</div>;
      }

      return (
        <div>
          User: {data.id} - {data.name}
        </div>
      );
    };

    const app = renderer.create(
      <Provider store={store}>
        <Component />
      </Provider>,
    );

    // Wait for query to complete
    await setTimeout(msToWaitBeforeRenderingWithoutLoadingState);

    const result = app.toJSON();
    expect(result).toBeDefined();
    const resultString = JSON.stringify(result);

    // Verify error response structure (tRPC errors are wrapped as TRPC_CLIENT_ERROR)
    expect(resultString).toContain("Error Status:");
    expect(resultString).toContain("TRPC_CLIENT_ERROR");
    expect(resultString).toContain("Error Message:");
    expect(resultString).toContain("User not found");
  });

  it("should handle errors in mutations", async () => {
    const client = createTRPCProxyClient<AppRouter>(errorTestClientOptions);
    const api = enhanceApi({
      api: createApi({
        baseQuery: () => ({ data: undefined }),
        endpoints: () => ({}),
        reducerPath: "api",
      }),
      client,
    });

    const store = configureStore({
      middleware: (getDefaultMiddleware) => [...getDefaultMiddleware(), api.middleware],
      reducer: {
        [api.reducerPath]: api.reducer,
      },
    });

    const Component = () => {
      const { useUpdateNameMutation } = api;
      const [updateName, { error, isLoading }] = useUpdateNameMutation();
      const [mutationTriggered, setMutationTriggered] = React.useState(false);

      React.useEffect(() => {
        if (!mutationTriggered) {
          setMutationTriggered(true);
          // Try to update non-existent user
          void updateName({ id: 999, name: "Test" });
        }
      }, [mutationTriggered, updateName]);

      if (isLoading) {
        return <div>Loading...</div>;
      }

      if (error) {
        const typedError = error as TRPCBaseQueryError;

        if (typedError.status === "TRPC_CLIENT_ERROR") {
          return (
            <div>
              <div>Mutation Error Status: {typedError.status}</div>
              <div>Mutation Error Message: {typedError.message}</div>
            </div>
          );
        }

        if (typedError.status === "TRPC_ERROR") {
          return (
            <div>
              <div>Mutation Error Status: {typedError.status}</div>
              <div>Mutation Error Message: {typedError.message}</div>
              <div>Mutation Status Code: {typedError.statusCode}</div>
            </div>
          );
        }

        return <div>Unexpected mutation error: {typedError.status}</div>;
      }

      return <div>Waiting...</div>;
    };

    const app = renderer.create(
      <Provider store={store}>
        <Component />
      </Provider>,
    );

    // Wait for mutation to complete
    await setTimeout(msToWaitBeforeRenderingWithoutLoadingState);

    const result = app.toJSON();
    expect(result).toBeDefined();
    const resultString = JSON.stringify(result);

    // Verify mutation error response structure (tRPC errors are wrapped as TRPC_CLIENT_ERROR)
    expect(resultString).toContain("Mutation Error Status:");
    expect(resultString).toContain("TRPC_CLIENT_ERROR");
    expect(resultString).toContain("Mutation Error Message:");
    expect(resultString).toContain("User not found");
  });

  it("should allow type-safe error handling with discriminated unions", async () => {
    const client = createTRPCProxyClient<AppRouter>(errorTestClientOptions);
    const api = enhanceApi({
      api: createApi({
        baseQuery: () => ({ data: undefined }),
        endpoints: () => ({}),
        reducerPath: "api",
      }),
      client,
    });

    const store = configureStore({
      middleware: (getDefaultMiddleware) => [...getDefaultMiddleware(), api.middleware],
      reducer: {
        [api.reducerPath]: api.reducer,
      },
    });

    const Component = () => {
      const { useGetUserByIdQuery } = api;
      const { error, isLoading } = useGetUserByIdQuery(999);

      if (isLoading) {
        return <div>Loading...</div>;
      }

      if (error) {
        // Type-safe discriminated union handling
        switch (error.status) {
          case "TRPC_CLIENT_ERROR": {
            return (
              <div>
                <div>Client Error</div>
                <div>Message: {error.message}</div>
                <div>Name: {error.name}</div>
              </div>
            );
          }
          case "TRPC_ERROR": {
            return (
              <div>
                <div>Server Error</div>
                <div>Message: {error.message}</div>
                <div>Status Code: {error.statusCode}</div>
              </div>
            );
          }
          case "UNKNOWN_ERROR": {
            return (
              <div>
                <div>Unknown Error</div>
                <div>Error: {error.error}</div>
              </div>
            );
          }
          default: {
            // TypeScript should know this is unreachable
            const _exhaustive: never = error;
            return <div>Unreachable: {String(_exhaustive)}</div>;
          }
        }
      }

      return <div>Success</div>;
    };

    const app = renderer.create(
      <Provider store={store}>
        <Component />
      </Provider>,
    );

    // Wait for query to complete
    await setTimeout(msToWaitBeforeRenderingWithoutLoadingState);

    const result = app.toJSON();
    expect(result).toBeDefined();
    const resultString = JSON.stringify(result);

    // Should handle as client error (tRPC errors are wrapped as TRPC_CLIENT_ERROR)
    expect(resultString).toContain("Client Error");
    expect(resultString).toContain("Message:");
  });
});
