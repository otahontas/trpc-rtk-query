# Separate Backend/Frontend Repositories Example

This example demonstrates how to use `trpc-rtk-query` when your backend and frontend are in separate repositories or projects.

## Overview

This setup simulates a real-world scenario where:
- **Backend** is a separate Express + tRPC API server
- **Frontend** is a separate React application using Vite
- Types are shared between the two projects

## Architecture

```
01-separate-repos/
├── backend/           # Express + tRPC server
│   ├── src/
│   │   ├── server.ts  # Express server
│   │   ├── router.ts  # tRPC router (AppRouter type exported here)
│   │   └── db.ts      # Mock database
│   └── package.json
│
└── frontend/          # React + Vite app
    ├── src/
    │   ├── api.ts     # tRPC RTK Query integration
    │   ├── store.ts   # Redux store
    │   └── components/
    └── package.json
```

## Quick Start

### 1. Start the Backend

```bash
cd backend
npm install  # or pnpm install
npm run dev
```

The backend will run on `http://localhost:3000`

### 2. Start the Frontend

In a new terminal:

```bash
cd frontend
npm install  # or pnpm install
npm run dev
```

The frontend will run on `http://localhost:5173`

### 3. Open the App

Visit `http://localhost:5173` in your browser to see the app in action.

## What This Example Demonstrates

### Backend Features

1. **tRPC Router Definition**: Fully typed procedures with Zod validation
2. **Nested Routers**: Organization of routes into logical groups (users, posts)
3. **Error Handling**: Proper error responses with tRPC error codes
4. **CORS Configuration**: Setup for cross-origin requests

### Frontend Features

1. **Type-Safe API Calls**: Automatic type inference from backend router
2. **RTK Query Integration**: Auto-generated hooks for all tRPC procedures
3. **Cache Management**: Tag-based invalidation for optimistic updates
4. **Error Handling**: Proper error display and loading states
5. **Mutations**: Creating, updating, and deleting resources

### Integration Points

1. **tRPC Client Setup**: Connecting to the backend via HTTP batch link
2. **API Enhancement**: Using `enhanceApi` to wrap RTK Query with tRPC types
3. **Hook Generation**: Automatic creation of typed React hooks
4. **Tag-Based Caching**: Configuring cache invalidation strategies

## Type Sharing Between Repositories

In this example, the `AppRouter` type from the backend needs to be available to the frontend. There are several approaches:

### Option 1: Shared Package (Recommended for Production)

Create a shared types package:

```
packages/
├── backend/
├── frontend/
└── shared-types/
    └── index.ts  # export type { AppRouter } from '../backend/src/router'
```

Then import in frontend:

```typescript
import type { AppRouter } from "@your-org/shared-types";
```

### Option 2: Monorepo (See Monorepo Example)

Use a monorepo tool (pnpm workspaces, Turborepo, Nx) to share types across packages.

### Option 3: Build Step

Set up a build step to copy or generate types from backend to frontend.

### Option 4: Manual Sync (This Example)

For simplicity, this example uses a placeholder type. In a real app, you would use one of the above methods.

## API Endpoints

### Users

- **List Users**: `GET /trpc/user.list`
- **Get User**: `GET /trpc/user.getById?input=1`
- **Create User**: `POST /trpc/user.create`
- **Update User**: `POST /trpc/user.update`
- **Delete User**: `POST /trpc/user.delete`

### Posts

- **List Posts**: `GET /trpc/post.list`
- **Get Post**: `GET /trpc/post.getById?input=1`
- **Get Posts by Author**: `GET /trpc/post.getByAuthor?input=1`
- **Create Post**: `POST /trpc/post.create`
- **Update Post**: `POST /trpc/post.update`
- **Delete Post**: `POST /trpc/post.delete`

## Generated Hooks

The frontend automatically gets these typed hooks:

```typescript
// User hooks
useUser_ListQuery()
useUser_GetByIdQuery(id: number)
useUser_CreateMutation()
useUser_UpdateMutation()
useUser_DeleteMutation()

// Post hooks
usePost_ListQuery(options?: { published?: boolean })
usePost_GetByIdQuery(id: number)
usePost_GetByAuthorQuery(authorId: number)
usePost_CreateMutation()
usePost_UpdateMutation()
usePost_DeleteMutation()
```

## Cache Invalidation Strategy

The example demonstrates tag-based cache invalidation:

```typescript
endpointOptions: {
  user_List: {
    providesTags: ["User"],  // This query provides "User" tag
  },
  user_Create: {
    invalidatesTags: ["User"],  // This mutation invalidates "User" tag
  },
}
```

When a user is created, the user list is automatically refetched.

## Next Steps

- See the [SPA example](../02-spa) for a simpler setup
- See the [Monorepo example](../03-monorepo) for better type sharing
- See the [SSR example](../04-ssr) for Next.js integration
- See the [React Native example](../05-react-native) for mobile apps

## Troubleshooting

### Backend not responding

- Check if the backend is running on port 3000
- Check CORS configuration
- Check backend logs for errors

### Type errors in frontend

- Ensure the `AppRouter` type matches the backend
- Check that all imports are correct
- Clear TypeScript cache and restart TS server

### Data not updating after mutations

- Check that tag-based invalidation is configured
- Check Redux DevTools to see if mutations are successful
- Check network tab for API responses
