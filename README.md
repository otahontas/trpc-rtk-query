# tRPC - RTK Query -bindings

Generate rtk query api endpoints automatically from your trpc setup!

This is very much work in progress -project, but when ready, my goal is to provide [react-query like tRPC experience](https://trpc.io/docs/client/react) for Redux toolkit users. Here are some usage pattern I'm planning to support:

## Create new api

```ts
// file: api.ts
import type { AppRouter } from '../server/router'; // <- types from your server, say for a router like this:
// const appRouter = router({
//   userList: publicProcedure
//     .query(async () => {
//       return await db.user.findMany();
//     }),
// });

export const api = createTRPCApi<AppRouter>({ // <- takes in the same options as createTRPCProxyClient and sets up api like createApi would do
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
}): 

export { useUserListQuery } from api; // <- Export your typed hooks

// file: store.ts
import { configureStore } from '@reduxjs/toolkit'
import { api } from './services/pokemon'

export const store = configureStore({ // <- Setup store with api like you would according to rtk query docs
  reducer: {
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(pokemonApi.middleware),
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
const App = () => {
  const { data, isLoading } = useYourEndpointNameQuery({ params }) // <- Use your generated hooks! They are fully typed based on your trpc router.
  if (isLoading) return <p>Loading...</p>
  if (!data) return <p>No data!</p>
  return <p>{JSON.strinfigy(data)}</p>
}
```

I'm planning to also support following approaches:

## Premade client

```ts

// file: api.ts
import { trpcClient } from "clien-from-your-own-package" // maybe from your monorepo package or private npm library


export const api = createTRPCApi(trpcClient); // <- infers types directly from client


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

export const trpcApi = createTRPCApi<AppRouter>(api); // endpoint are injected to api and you can 

export { useUserListQuery } from api;

// Again, otherwise the same setup
```

## TODO

- [x] Generate rtk query api with given `AppRouter` typings (simplest version)
- [] Support deep routers from trpc
- [] Allow passing in custom client, use that instead of generating internal client
- [] Allow passing in already existing api
- [] Allow merging extra parameters to injected endpoints to e.g. make optimistic updates possible
- [] Allow merging extra parameters to createApi to e.g. make optimistic updates possible
- [] e2e tests
- [] ci
- [] publish package
- [] remove unnecessary stuff from distributed package (e.g. don't have jsx in tsconfig etc)
- [] this is very react heavy approach, test against vue and svelte too
