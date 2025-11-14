# Monorepo Example

This example demonstrates using `trpc-rtk-query` in a monorepo structure with pnpm workspaces.

## Structure

```
03-monorepo/
├── packages/
│   ├── shared/       # Shared types and tRPC router
│   ├── backend/      # Express + tRPC server
│   └── frontend/     # React + Vite app
├── pnpm-workspace.yaml
└── package.json
```

## Key Benefits

1. **Shared Types**: Types defined once in `@trpc-rtk-example/shared`
2. **Type Safety**: Full type inference across packages
3. **Independent Versioning**: Each package can be versioned separately
4. **Optimized Development**: Changes in shared propagate automatically

## Quick Start

```bash
# Install dependencies for all packages
pnpm install

# Build shared package
pnpm --filter shared build

# Run all in dev mode
pnpm dev

# Or run individually
pnpm dev:backend
pnpm dev:frontend
```

## Type Sharing Pattern

```typescript
// packages/shared/src/router.ts
export const createAppRouter = (db) => router({ ... });

// packages/backend/src/server.ts
import { createAppRouter } from "@trpc-rtk-example/shared";
const appRouter = createAppRouter(db);
export type AppRouter = typeof appRouter;

// packages/frontend/src/api.ts
import type { AppRouter } from "@trpc-rtk-example/backend";
// Full type safety!
```

Perfect for medium to large teams and production applications.
