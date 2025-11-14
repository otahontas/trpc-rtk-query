# tRPC RTK Query Frontend Example

This is the frontend for the separate repositories example. It demonstrates how to use `trpc-rtk-query` to automatically generate RTK Query hooks from a tRPC backend.

## Features

- **React + Vite**: Fast development with hot module replacement
- **TypeScript**: Full type safety from backend to frontend
- **RTK Query**: Powerful data fetching and caching
- **tRPC Integration**: Automatically generated type-safe hooks
- **Tag-Based Cache Invalidation**: Optimistic updates and automatic refetching

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── UserList.tsx       # Display and manage users
│   │   ├── PostList.tsx       # Display and manage posts
│   │   ├── CreateUser.tsx     # Create new users
│   │   └── CreatePost.tsx     # Create new posts
│   ├── api.ts                  # tRPC RTK Query integration
│   ├── store.ts                # Redux store configuration
│   ├── types.ts                # Shared types
│   ├── App.tsx                 # Main app component
│   └── main.tsx                # Entry point
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

## Setup

1. **Make sure the backend is running** (see backend README)

2. Install dependencies:

```bash
npm install
# or
pnpm install
```

3. Start the development server:

```bash
npm run dev
# or
pnpm dev
```

The app will be available at `http://localhost:5173`

## Key Integration Points

### 1. tRPC Client Setup (src/api.ts)

```typescript
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";

const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${BACKEND_URL}/trpc`,
    }),
  ],
});
```

### 2. Enhancing RTK Query API

```typescript
import { enhanceApi } from "trpc-rtk-query";

export const api = enhanceApi({
  api: baseApi,
  client: trpcClient,
  endpointOptions: {
    // Configure cache tags and invalidation
    user_List: {
      providesTags: ["User"],
    },
    user_Create: {
      invalidatesTags: ["User"],
    },
  },
});
```

### 3. Using Generated Hooks

```typescript
// Automatically generated from tRPC router!
const { data: users, isLoading } = useUser_ListQuery();
const [createUser] = useUser_CreateMutation();
```

## Type Sharing

In this example, types are manually defined in `src/types.ts`. In a real application, you would:

1. **Publish Backend Types as Package**: Create a shared package with the `AppRouter` type
2. **Use Monorepo**: Share types across packages in a monorepo
3. **Generate Types**: Use a build step to export types from backend

Example with shared package:

```typescript
// Instead of defining types manually
import type { AppRouter } from "@your-org/backend-types";
```

## Cache Management

The app demonstrates RTK Query's powerful caching features:

- **Automatic Refetching**: Data is automatically refetched when invalidated
- **Tag-Based Invalidation**: Mutations automatically invalidate related queries
- **Optimistic Updates**: UI updates immediately, rolls back on error
- **Normalized Caching**: Efficient data storage and updates

## Environment Variables

Create a `.env` file to configure the backend URL:

```env
VITE_BACKEND_URL=http://localhost:3000
```

## Production Build

1. Build the app:

```bash
npm run build
# or
pnpm build
```

2. Preview the production build:

```bash
npm run preview
# or
pnpm preview
```

## Common Patterns Demonstrated

### 1. Queries with Parameters

```typescript
// Posts can be filtered by published status
const { data } = usePost_ListQuery({ published: true });
```

### 2. Mutations with Cache Invalidation

```typescript
const [createUser] = useUser_CreateMutation();

// This will automatically invalidate the user list query
await createUser({ name: "John", email: "john@example.com" });
```

### 3. Nested Router Access

```typescript
// Nested routes are flattened with underscores
// Backend: router.user.getById
// Frontend: useUser_GetByIdQuery
```

### 4. Error Handling

```typescript
const { data, error, isLoading } = useUser_ListQuery();

if (error) {
  return <div>Error: {JSON.stringify(error)}</div>;
}
```

## Next Steps

- Add authentication
- Implement optimistic UI updates
- Add loading skeletons
- Implement pagination
- Add error boundaries
- Add tests with React Testing Library
