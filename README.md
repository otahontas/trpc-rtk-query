![trpc-rtk-query](assets/logo.png)

<div align="center">
  <h1>trpc-rtk-query</h1>
  <a href="https://www.npmjs.com/package/trpc-rtk-query"><img src="https://img.shields.io/npm/v/trpc-rtk-query.svg?style=flat&color=brightgreen" target="_blank" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-black" /></a>
  <br />
</div>

#### `trpc-rtk-query` is the tool for automatically generating RTK Query api endpoints from your tRPC setup!


---

## **[RTK Query](https://redux-toolkit.js.org/rtk-query/overview) support for [tRPC](https://trpc.io/)** 🧩

- Automatically generate **typesafe** `RTK Query hooks` from your `tRPC` procedures.
- Perfect for incremental adoption.
- Any feedback, issues, or pull requests are highly appreciated

```typescript

import { createApi } from "trpc-rtk-query";

const api = createApi({
  client: trpcClient, /* 👈 This is the magic */
  /* ⬇️  You can still pass all the RTK config properties */
  tagTypes: ["User"],
  reducerPath: "trpcApi"
});

export { useUserListQuery } from api; // Automatically typed hooks thanks to the power of tRPC + RTK!
```

## Usage

### Installation

**1. Install `trpc-rtk-query` and peer dependencies.**

```bash
# npm
npm install trpc-rtk-query @reduxjs/toolkit @trpc/client @trpc/server
# yarn
yarn add trpc-rtk-query @reduxjs/toolkit @trpc/client @trpc/server
```

Note the minimum versions for packages:

- @reduxjs/toolkit: `1.9.5`
- @trpc/client & @trpc/server `10.31.0`

**2. Initialize the `tRPC router`.**

```typescript
/* server.ts */
import { initTRPC } from "@trpc/server";
import { z } from "zod";

import { db as database } from "./db";

const t = initTRPC.create();
export const publicProcedure = t.procedure;
const appRouter = t.router({
  userList: publicProcedure
    .input(z.object({ showAll: z.boolean() })) // <- type is { showAll: boolean }
    .query(async () => {
      // Retrieve users from a datasource, this is an imaginary database
      return await database.user.findMany(); // <- returns type User[]
    }),
});
export type AppRouter = typeof appRouter
```

**3. Create a new tRPC Client.**

Create your api [like normal](https://trpc.io/docs/client/vanilla):

```typescript
// client.ts
const client = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/trpc',
      // You can pass any HTTP headers you wish here
      async headers() {
        return {
          authorization: getAuthCookie(),
        };
      },
    }),
  ],
});

```

**4. Create a new automatically typed API.**

```typescript
// api.ts
import { createApi } from "trpc-rtk-query";

const api = createApi({
  client, /* 👈 This is the magic */
  /* ⬇️  You can still pass all the RTK config properties */
  tagTypes: ["User"],
  reducerPath: "trpcApi"
});

export { useUserListQuery } from api; // Automatically typed hooks thanks to the power of tRPC + RTK!
```

**5. Add the typesafe API to the store.**
This is the same step as you would [normally do](https://redux-toolkit.js.org/rtk-query/overview).

```typescript
// store.ts
import { configureStore } from '@reduxjs/toolkit'
import { api } from './api.ts'

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
})
```

**6. Enjoy type-safe hooks.**

```typescript
// app.ts
import { useUserListQuery } from "./api.ts"
const App = () => {
  const { data, isLoading } = useUserListQuery({ showAll: true })
  // ^ Use your generated hooks! They are fully typed based on your trpc router.
  if (isLoading) return <p>Loading...</p>
  if (!data) return <p>No data!</p>
  return <p>{JSON.strinfigy(data)}</p>
  //                         ^ type: User[]
}
```

### Using existing api

You might already have an RTK query API instance for a non-tRPC backend. In this case, you can pass the previous API in with the tRPC client, and new endpoints will be generated similarly as above.

```typescript
import { enhanceApi } from "trpc-rtk-query";
export const api = enhanceApi({
  client, // <- your typed client from step 1
  api: existingApi // <- your existing api
  // pass in any endpoint specific options, such as providesTags or onQueryStarted for optimistic updates
  endpointOptions: {
    userList: {
      providesTags: ["User"]
    }
  }
});

export { useUserListQuery } from api; // <- export your typed hooks
```

# Development status

This library is currently in the alpha stage. 0.0.x versions are being published to npm for people to try this out, but you shouldn't consider it ready for production anytime soon. See the [0.1.0 project](https://github.com/users/otahontas/projects/2) for what's under development and planned to be done before 0.1.0 can be released.
