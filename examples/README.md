# tRPC RTK Query Examples

This directory contains comprehensive examples demonstrating how to use `trpc-rtk-query` in different scenarios and architectures.

## Available Examples

### 1. [Separate Backend/Frontend Repositories](./01-separate-repos)

**Best for**: Traditional separation of concerns, multiple frontends consuming one backend

- Backend: Express + tRPC server
- Frontend: React + Vite app
- Demonstrates: Type sharing across repositories

```bash
cd examples/01-separate-repos/backend && npm install && npm run dev
cd examples/01-separate-repos/frontend && npm install && npm run dev
```

### 2. [Single Page Application (SPA)](./02-spa) ⭐ **Recommended for Getting Started**

**Best for**: Simple projects, learning, rapid prototyping

- All-in-one: Backend and frontend in same codebase
- Features: Client-side routing, CRUD operations, cache management
- Demonstrates: Direct type imports, optimistic updates

```bash
cd examples/02-spa && npm install && npm run dev
```

### 3. [Monorepo with Workspaces](./03-monorepo)

**Best for**: Large teams, microservices, shared component libraries

- Structure: Separate packages for shared types, backend, frontend
- Tool: pnpm workspaces
- Demonstrates: Package organization, independent versioning

```bash
cd examples/03-monorepo && pnpm install && pnpm dev
```

### 4. [Next.js with SSR](./04-nextjs)

**Best for**: SEO-critical applications, full-stack Next.js projects

- Framework: Next.js 14+ with App Router
- Features: Server-side rendering, API routes, React Server Components
- Demonstrates: SSR hydration, server/client data fetching

```bash
cd examples/04-nextjs && npm install && npm run dev
```

### 5. [React Native Mobile App](./05-react-native)

**Best for**: iOS and Android applications

- Platform: React Native with Expo
- Features: Mobile-optimized queries, offline support
- Demonstrates: Platform-specific API URLs, mobile best practices

```bash
cd examples/05-react-native && npm install && npm start
```

## Quick Comparison

| Example | Complexity | Type Sharing | Use Case |
|---------|-----------|--------------|----------|
| **01-separate-repos** | ⭐⭐⭐ | Manual/Package | Multiple repos |
| **02-spa** | ⭐ | Direct imports | Simple apps |
| **03-monorepo** | ⭐⭐⭐⭐ | Workspace packages | Large teams |
| **04-nextjs** | ⭐⭐⭐ | Direct imports | SEO apps |
| **05-react-native** | ⭐⭐ | Direct imports | Mobile apps |

## Core Concepts Demonstrated

All examples demonstrate these key concepts:

### 1. Type-Safe API Calls

```typescript
// Backend defines the router
export const appRouter = router({
  user: userRouter,
  post: postRouter,
});
export type AppRouter = typeof appRouter;

// Frontend gets automatic type inference
const { data } = useUser_ListQuery();
//     ^ Fully typed based on backend!
```

### 2. Auto-Generated Hooks

```typescript
// From tRPC procedure: user.getById
const { data } = useUser_GetByIdQuery(1);

// From tRPC procedure: user.create
const [createUser] = useUser_CreateMutation();
```

### 3. Cache Management

```typescript
export const api = enhanceApi({
  api: baseApi,
  client: trpcClient,
  endpointOptions: {
    user_List: {
      providesTags: ["User"],      // Provides cache tag
    },
    user_Create: {
      invalidatesTags: ["User"],   // Invalidates on mutation
    },
  },
});
```

### 4. Nested Router Handling

```typescript
// Backend nested router
const appRouter = router({
  user: router({
    profile: router({
      get: procedure.query(/* ... */),
    }),
  }),
});

// Frontend auto-generated hook (flattened with underscores)
useUser_Profile_GetQuery();
```

## Getting Started

1. **Choose an example** based on your architecture
2. **Follow the README** in that example's directory
3. **Install dependencies** using npm, pnpm, or yarn
4. **Start the dev server(s)**
5. **Explore the code** to understand the integration

## Common Patterns

### Creating a tRPC Client

```typescript
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: "http://localhost:3000/trpc",
      headers: async () => ({
        authorization: getAuthToken(),
      }),
    }),
  ],
});
```

### Enhancing RTK Query API

```typescript
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { enhanceApi } from "trpc-rtk-query";

const baseApi = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: "/" }),
  tagTypes: ["User", "Post"],
  endpoints: () => ({}),
});

export const api = enhanceApi({
  api: baseApi,
  client: trpcClient,
  endpointOptions: {
    // Configure cache tags and options
  },
});
```

### Using in Components

```typescript
import { useUser_ListQuery, useUser_CreateMutation } from "./api";

function UserList() {
  const { data, isLoading, error } = useUser_ListQuery();
  const [createUser] = useUser_CreateMutation();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
      <button onClick={() => createUser({ name: "John" })}>
        Add User
      </button>
    </div>
  );
}
```

## Features Across Examples

- ✅ **Type Safety**: End-to-end type inference
- ✅ **Auto-Generated Hooks**: No manual hook creation
- ✅ **Cache Management**: RTK Query's powerful caching
- ✅ **Optimistic Updates**: Instant UI feedback
- ✅ **Error Handling**: Comprehensive error states
- ✅ **Loading States**: Built-in loading indicators
- ✅ **Tag-Based Invalidation**: Automatic refetching

## Need Help?

- **Documentation**: See the main [README](../README.md)
- **Issues**: Report problems on [GitHub](https://github.com/otahontas/trpc-rtk-query/issues)
- **Examples**: Each example has its own detailed README

## Contributing

Found an issue or want to add an example? Please open a PR!

Areas for contribution:
- Authentication examples
- File upload examples
- WebSocket integration
- Testing strategies
- Deployment guides

## License

All examples are provided under the MIT license, same as the main library.
