# Single Page Application (SPA) Example

This example demonstrates how to use `trpc-rtk-query` in a Single Page Application where both the backend and frontend are in the same codebase.

## Overview

This is a complete todo application featuring:
- **Express + tRPC backend** serving the API
- **React + Vite frontend** with client-side routing
- **Shared type safety** between client and server
- **Full CRUD operations** with optimistic updates
- **Cache management** using RTK Query tags

## Features

- Type-safe API calls from frontend to backend
- Auto-generated RTK Query hooks from tRPC router
- Client-side routing with React Router
- Responsive UI with inline styles
- Optimistic UI updates
- Tag-based cache invalidation

## Project Structure

```
02-spa/
├── src/
│   ├── server/
│   │   ├── index.ts    # Express server
│   │   ├── router.ts   # tRPC router
│   │   └── db.ts       # Mock database
│   └── client/
│       ├── main.tsx    # Client entry point
│       ├── App.tsx     # Main app component
│       ├── api.ts      # tRPC RTK Query integration
│       ├── store.ts    # Redux store
│       ├── pages/      # Route pages
│       └── components/ # UI components
├── package.json
├── vite.config.ts
└── README.md
```

## Quick Start

1. **Install dependencies:**

```bash
npm install
# or
pnpm install
```

2. **Start development servers:**

```bash
npm run dev
# or
pnpm dev
```

This will start:
- Backend server on `http://localhost:3000`
- Vite dev server on `http://localhost:5173`

3. **Open the app:**

Visit `http://localhost:5173` in your browser

## Available Scripts

- `npm run dev` - Start both backend and frontend in development mode
- `npm run dev:server` - Start only the backend server
- `npm run dev:client` - Start only the frontend dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm start` - Run production server

## Type Safety

The key advantage of this setup is **complete type safety** from backend to frontend:

### 1. Backend Router Definition

```typescript
// src/server/router.ts
export const appRouter = router({
  todo: todoRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
```

### 2. Frontend API Integration

```typescript
// src/client/api.ts
import type { AppRouter } from "../server/router";

const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: "/trpc" })],
});

export const api = enhanceApi({
  api: baseApi,
  client: trpcClient,
});
```

### 3. Using Generated Hooks

```typescript
// src/client/pages/TodoList.tsx
const { data: todos, isLoading } = useTodo_ListQuery();
const [createTodo] = useTodo_CreateMutation();
```

All hooks are **automatically typed** based on your tRPC router!

## API Endpoints

The tRPC router exposes these procedures:

### Todo Operations

- `todo.list` - Get all todos
- `todo.getById(id)` - Get a single todo
- `todo.getByUser(userId)` - Get todos for a specific user
- `todo.create(data)` - Create a new todo
- `todo.update(data)` - Update a todo
- `todo.delete(id)` - Delete a todo
- `todo.toggleComplete(id)` - Toggle todo completion status

### User Operations

- `user.list` - Get all users
- `user.getById(id)` - Get a single user

## Generated Hooks

`trpc-rtk-query` automatically generates these hooks:

```typescript
// Queries
useTodo_ListQuery()
useTodo_GetByIdQuery(id: number)
useTodo_GetByUserQuery(userId: number)
useUser_ListQuery()
useUser_GetByIdQuery(id: number)

// Mutations
useTodo_CreateMutation()
useTodo_UpdateMutation()
useTodo_DeleteMutation()
useTodo_ToggleCompleteMutation()
```

## Cache Management

RTK Query's tag-based caching ensures data stays in sync:

```typescript
endpointOptions: {
  todo_List: {
    providesTags: ["Todo"],  // This query provides "Todo" data
  },
  todo_Create: {
    invalidatesTags: ["Todo"],  // This mutation invalidates "Todo" cache
  },
}
```

When you create, update, or delete a todo, the todo list automatically refetches!

## Routing

The app uses React Router for client-side navigation:

- `/` - Home page with stats
- `/todos` - Todo list and creation
- `/about` - About page with technical details

## Development Workflow

1. **Add a new procedure** to the tRPC router in `src/server/router.ts`
2. **Configure cache tags** in `src/client/api.ts` if needed
3. **Use the auto-generated hook** in your React components
4. **TypeScript validates everything** - no manual type definitions needed!

## Advantages of SPA Setup

1. **Single codebase** - Both frontend and backend in one repo
2. **Direct type imports** - No need for separate type packages
3. **Simplified deployment** - Deploy as a single application
4. **Faster development** - Changes to backend immediately available to frontend
5. **Easy to understand** - Great for learning and small projects

## Production Build

1. **Build the application:**

```bash
npm run build
```

This creates:
- `dist/client/` - Built frontend files
- `dist/server/` - Compiled backend code

2. **Start production server:**

```bash
npm start
```

The server will serve both the API and static files.

## Deployment

You can deploy this SPA to:

- **Traditional hosting** (VPS, EC2, etc.)
- **Platform as a Service** (Heroku, Railway, Render)
- **Containerized** (Docker, Kubernetes)

Just ensure:
1. Node.js 20+ is available
2. Run `npm install` and `npm run build`
3. Start with `npm start`
4. Configure port via `PORT` environment variable

## Differences from Separate Repos

| Aspect | SPA | Separate Repos |
|--------|-----|----------------|
| Type sharing | Direct imports | Package/build step needed |
| Deployment | Single app | Two separate deployments |
| Development | One dev server (with proxy) | Two dev servers |
| Complexity | Lower | Higher |
| Scaling | Limited | Better for large teams |

## Next Steps

- Explore [Monorepo example](../03-monorepo) for better organization at scale
- Check out [SSR example](../04-ssr) for Next.js integration
- See [React Native example](../05-react-native) for mobile apps

## Troubleshooting

### Port conflicts

If port 3000 or 5173 is in use, update:
- Backend: `src/server/index.ts` (PORT variable)
- Frontend: `vite.config.ts` (server.port)

### Build errors

Clear caches and reinstall:

```bash
rm -rf node_modules dist
npm install
npm run build
```

### Type errors

Make sure TypeScript can resolve the server types:

```bash
# Check TypeScript compilation
npx tsc --noEmit
```
