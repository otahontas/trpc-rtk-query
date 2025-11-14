import { createApi } from "@reduxjs/toolkit/query/react";
import { createTRPCProxyClient } from "@trpc/client";
import { describe, it } from "vitest";

import { enhanceApi } from "../src/index.js";
import { type AppRouter, testClientOptions } from "./fixtures.js";

describe("endpoint options validation", () => {
  const client = createTRPCProxyClient<AppRouter>(testClientOptions);
  const existingApi = createApi({
    baseQuery: (string_: string) => {
      return {
        data: {
          string_,
        },
      };
    },
    endpoints: (builder) => ({
      getResponse: builder.query<string, string>({
        query: (string_: string) => string_,
      }),
    }),
    reducerPath: "premadeApi",
    tagTypes: ["User"],
  });

  describe("query endpoints", () => {
    it("allows providesTags on query endpoints", () => {
      // This should compile without errors
      enhanceApi({
        api: existingApi,
        client,
        endpointOptions: {
          getUserById: {
            providesTags: (result) => [{ id: result?.id, type: "User" }],
          },
        },
      });
    });

    it("allows other query-specific options", () => {
      // This should compile without errors
      enhanceApi({
        api: existingApi,
        client,
        endpointOptions: {
          getUserById: {
            keepUnusedDataFor: 60,
          },
        },
      });
    });

    it("disallows invalidatesTags on query endpoints", () => {
      // First verify that providesTags works (positive test)
      enhanceApi({
        api: existingApi,
        client,
        endpointOptions: {
          getUserById: {
            providesTags: ["User"], // This should work
          },
        },
      });

      // Now test that invalidatesTags doesn't work (negative test)
      enhanceApi({
        api: existingApi,
        client,
        endpointOptions: {
          getUserById: {
            // @ts-expect-error - invalidatesTags should not be allowed on queries
            invalidatesTags: ["User"],
          },
        },
      });
    });
  });

  describe("mutation endpoints", () => {
    it("allows invalidatesTags on mutation endpoints", () => {
      // This should compile without errors
      enhanceApi({
        api: existingApi,
        client,
        endpointOptions: {
          updateName: {
            invalidatesTags: ["User"],
          },
        },
      });
    });

    it("allows structuralSharing option on mutation endpoints", () => {
      // This should compile without errors
      enhanceApi({
        api: existingApi,
        client,
        endpointOptions: {
          updateName: {
            structuralSharing: false,
          },
        },
      });
    });

    it("disallows providesTags on mutation endpoints", () => {
      enhanceApi({
        api: existingApi,
        client,
        endpointOptions: {
          updateName: {
            // @ts-expect-error - providesTags should not be allowed on mutations
            providesTags: ["User"],
          },
        },
      });
    });

    it("disallows query-specific options on mutation endpoints", () => {
      enhanceApi({
        api: existingApi,
        client,
        endpointOptions: {
          updateName: {
            // @ts-expect-error - merge is query-specific and not allowed on mutations
            merge: (currentCache, newData) => {
              return newData;
            },
          },
        },
      });
    });
  });

  describe("multiple endpoints with mixed types", () => {
    it("correctly discriminates between query and mutation options", () => {
      // This should compile without errors
      enhanceApi({
        api: existingApi,
        client,
        endpointOptions: {
          getUserById: {
            // Query endpoint - providesTags is allowed
            providesTags: (result) => [{ id: result?.id, type: "User" }],
          },
          updateName: {
            // Mutation endpoint - invalidatesTags is allowed
            invalidatesTags: ["User"],
          },
        },
      });
    });

    it("prevents cross-contamination of options", () => {
      enhanceApi({
        api: existingApi,
        client,
        endpointOptions: {
          getUserById: {
            // @ts-expect-error - invalidatesTags should not be allowed on query
            invalidatesTags: ["User"],
          },
          updateName: {
            // @ts-expect-error - providesTags should not be allowed on mutation
            providesTags: ["User"],
          },
        },
      });
    });
  });
});
