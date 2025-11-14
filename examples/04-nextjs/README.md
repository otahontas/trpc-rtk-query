# Next.js SSR Example

This example demonstrates using `trpc-rtk-query` with Next.js App Router for server-side rendering.

## Features

- **Next.js App Router**: Modern Next.js with RSC support
- **Server-Side tRPC**: API routes using Next.js route handlers
- **RTK Query Integration**: Client-side data fetching with SSR hydration
- **Type Safety**: Full type inference from server to client

## Structure

```
04-nextjs/
├── src/
│   ├── server/       # tRPC router and API handlers
│   ├── app/          # Next.js App Router pages
│   └── store/        # Redux store configuration
└── package.json
```

## Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`

## Key Integration Points

### 1. API Route Handler

```typescript
// src/app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "~/server/router";

export const GET = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => ({}),
  });
```

### 2. Client-Side Setup

```typescript
// src/store/api.ts
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { enhanceApi } from "trpc-rtk-query";

const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [httpBatchLink({ url: "/api/trpc" })],
});

export const api = enhanceApi({
  api: baseApi,
  client: trpcClient,
});
```

### 3. Using in Server Components

```typescript
// src/app/page.tsx
import { api } from "~/store/api";

export default async function Page() {
  // Server-side data fetching
  const data = await fetch("/api/trpc/user.list").then((r) => r.json());

  return <ClientComponent initialData={data} />;
}
```

## SSR Considerations

- Use Next.js API routes for tRPC endpoints
- Hydrate Redux store on client-side
- Server Components can fetch data directly
- Client Components use RTK Query hooks

Perfect for SEO-critical applications and full-stack Next.js projects.
