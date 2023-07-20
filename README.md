# tRPC - RTK Query -bindings

Generate rtk query api endpoints automatically from your trpc setup!

This is very much work in progress -project, but when ready, my goal is to provide [react-query like tRPC experience](https://trpc.io/docs/client/react) for Redux toolkit users. Here are some usage patterns I'm planning to support:

## Create new api

```ts
// file: api.ts
import type { AppRouter } from '../server/router'; // <- types from your server,
// let's say for a router like this:
// const appRouter = router({
//   userList: publicProcedure
//     .input(z.object({ showAll: z.boolean() })) // <- type is { showAll: boolean }
//     .query(async () => {
//       return await db.user.findMany(); // <- returns type User[]
//     }),
// });

export const api = createTRPCApi<AppRouter>({ clientOptions: {
// ^ takes in the same options as createTRPCProxyClient and sets up api like
// createApi would do
  links: [
    httpBatchLink({
    url: 'http://localhost:3000/trpc',
    async headers() {
      return {
        authorization: getAuthCookie(),
      };
    },
    }),
  ],
}}):

export { useUserListQuery } from api; // <- Export your typed hooks

// file: store.ts
import { configureStore } from '@reduxjs/toolkit'
import { api } from './api.ts'

export const store = configureStore({
// ^ Setup store with api like you would  according to rtk query docs
  reducer: {
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
})



// file: index.ts
import { store } from './app/store'
import { Provider } from 'react-redux'
import ReactDOM from 'react-dom'
import App from './App'

ReactDOM.render(
  <Provider store={store}> // Setup provider like you would according to rtk query docs
    <App />
  </Provider>,
  document.getElementById('root')
)

// file: App.ts
import { useUserListQuery } from "./api"
const App = () => {
  const { data, isLoading } = useUserListQuery({ showAll: true })
  // ^ Use your generated hooks! They are fully typed based on your trpc router.
  if (isLoading) return <p>Loading...</p>
  if (!data) return <p>No data!</p>
  return <p>{JSON.strinfigy(data)}</p>
  //                         ^ type: User[]
}
```

I'm planning to also support following approaches:

## Premade client

```ts

// file: api.ts
import { trpcClient } from "clien-from-your-own-package"
// ^ maybe from your monorepo package or private npm library

export const api = createTRPCApi({ client: trpcClient });
// ^ infers types directly from client, you don't have to pass in AppRouter type

export { useUserListQuery } from api;

// Otherwise same setup
```

## Premade api

```ts
// file: api.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const api = createApi({
  reducerPath: 'pokemonApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://pokeapi.co/api/v2/' }),
  endpoints: (builder) => ({
    getPokemonByName: builder.query<Pokemon, string>({
      query: (name) => `pokemon/${name}`,
    }),
  }),
})


// tprcApi.ts
import { api } from "./api.ts"

const clientOptions = {
  links: [
    httpBatchLink({
    url: 'http://localhost:3000/trpc',
    async headers() {
      return {
        authorization: getAuthCookie(),
      };
    },
    }),
  ],
}


export const trpcApi = createTRPCApi<AppRouter>({
  api,
  clientOptions
});

export { useUserListQuery } from api;

// Again, otherwise the same setup
```

## TODO

- [x] Generate rtk query api with given `AppRouter` typings (simplest version)
- [x] Support deep routers from trpc
- [x] Allow passing in custom client, use that instead of generating internal client
- [x] Allow passing in custom client creator that has access to QueryFn parameters
- [x] Allow passing in already existing api
- [x] Investigate if using custom modules from rtk toolkit would be a better approach? --> was not
- [x] ci
- [ ] better ci with good test matrix
- [ ] remove unnecessary stuff from distributed package (e.g. don't have jsx in tsconfig etc)
- [ ] add proper build output, publishing
- [ ] split tests, add more unit tests
- [ ] e2e tests
- [ ] Allow passing in some parameters that can't be handled with enhanceEndpoints
- [ ] (maybe) allow transformresponse and transformerroresponse. not sure tho
- [ ] Better error types
- [ ] Support using trpc vanilla client extra options
- [ ] this is very react heavy approach, test against vue and svelte too
