# tRPC - RTK Query -bindings

Generate rtk query api endpoints automatically from your trpc setup!

## Development status

This library is currently in the alpha stage. 0.0.x versions are being published to npm for people to try this out, but you shouldn't consider it ready for production anytime soon. See the [0.1.0 project](https://github.com/users/otahontas/projects/2) for what's under development and planned to be done before 0.1.0 can be released.

Any feedback, issues, or pull requests are highly appreciated, so here's a short usage guide if you want to try this out:

## Usage

### Installation

Install the library and peer dependencies:

```sh
npm install trpc-rtk-query @reduxjs/toolkit @trpc/client @trpc/server
```

### Creating new api

Using the following tRPC router as an example:

```ts
// const appRouter = router({
//   userList: publicProcedure
//     .input(z.object({ showAll: z.boolean() })) // <- type is { showAll: boolean }
//     .query(async () => {
//       return await db.user.findMany(); // <- returns type User[]
//     }),
// });
// export type AppRouter = typeof appRouter
```

Create your api like this:

```ts
// 1. create your client according to: https://trpc.io/docs/client/vanilla
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

// 2. create your api by passing in client and possibly some options:
// (you can alternatively pass in getClient function that returns a promise with typed 
// trpcproxyclient)
export const api = createApi({
  client, // <- your typed client from step 1
  // pass in any api options you want, such as tagTypes or reducerPath
  tagTypes: ["User"],
  reducerPath: "trpcApi"
  // pass in any endpoint specific options, such as providesTags or onQueryStarted for optimistic updates
  endpointOptions: {
    userList: {
      providesTags: ["User"]
    }
  }
});

export { useUserListQuery } from api; // <- then export your typed hooks!

// 3. Add api to store like you would normally do with rtk query: https://redux-toolkit.js.org/rtk-query/overview
import { configureStore } from '@reduxjs/toolkit'
import { api } from './api.ts'

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
})

// 4. Use your typed hooks

import { useUserListQuery } from "your-api-file"
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

```ts
// 2. use enhanceApi instead of createApi to generate new hooks
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

Here you should skip the step since your API should already be added to the store. This works similarly to code splitting with RTK query's injectEndpoints (<https://redux-toolkit.js.org/rtk-query/usage/code-splitting>).
