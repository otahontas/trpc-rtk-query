# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is **trpc-rtk-query**, a TypeScript library that automatically generates RTK Query API endpoints from tRPC router setups. It enables type-safe RTK Query hooks from tRPC procedures, perfect for incremental adoption from tRPC to RTK Query.

**Project Status:**

- Library is in **alpha stage** (0.x.x versions) - not production ready
- **41 stars, 6 forks** - small but engaged community
- Uses **pnpm** as package manager (minimum Node.js 20)
- **Currently supports tRPC v10** - tRPC v11 upgrade planned (issue #406)
- Maintenance phase with excellent automated dependency management via Dependabot

## Common Development Commands

**Core Development:**

- `pnpm test` - Run all tests using Vitest
- `pnpm run coverage` - Run tests with coverage report
- `pnpm run typecheck` - Run TypeScript type checking only (via Vitest)
- `pnpm run lint` - Run ESLint and Prettier checks
- `pnpm run build` - Build the library using tsup

**Release Management:**

- `pnpm run changeset` - Create a changeset for versioning
- `pnpm run release` - Build and publish (runs build + changeset publish)

**Code Quality:**

- `pnpm run knip` - Find unused dependencies and exports

**Running Single Tests:**
Use Vitest's built-in filtering:

- `pnpm test create-trpc-api` - Run tests matching the pattern
- `pnpm test -- --typecheck.only` - Run only type tests

## Architecture Overview

**Core Library Structure:**

- `src/api.ts` - Main API with `enhanceApi()` and `createEmptyApi()` functions
- `src/create-endpoint-definitions.ts` - Complex TypeScript types that transform tRPC router types into RTK Query endpoint definitions
- `src/wrap-api-to-proxy.ts` - Proxy wrapper that dynamically creates RTK Query endpoints from tRPC client calls
- `src/create-trpc-base-query.ts` - Custom base query implementation for tRPC
- `src/trpc-client-options.ts` - Type definitions for tRPC client configuration

**Key Concepts:**

1. **Type Transformation**: The library uses advanced TypeScript to flatten nested tRPC routers into RTK Query endpoint definitions
2. **Runtime Proxy**: Uses JavaScript Proxy to intercept property access and dynamically inject RTK Query endpoints
3. **Endpoint Naming**: Nested routes are flattened with underscore separation (e.g., `nested.deep.getUser` becomes `nested_deep_GetUser`)

**Test Architecture:**

- Uses Vitest with happy-dom environment
- `test/fixtures.ts` contains a comprehensive test tRPC router with nested routes, queries, and mutations
- Type-level tests use `.test-d.ts` files for TypeScript assertion testing
- Integration tests verify the full tRPC → RTK Query transformation

**Build System:**

- Uses `tsup` for building with both CJS and ESM outputs
- TypeScript builds reference `tsconfig.build.json`
- Supports both Node.js require() and ESM import()

## Key Technical Details

**Type System Complexity:**
The `CreateEndpointDefinitions` type in `create-endpoint-definitions.ts` is the heart of the library - it recursively flattens tRPC router types and transforms them into RTK Query-compatible endpoint definitions.

**Dynamic Endpoint Injection:**
The `wrapApiToProxy` function creates a Proxy that intercepts property access and uses RTK Query's `injectEndpoints` to dynamically add tRPC-backed endpoints at runtime.

**Testing Strategy:**

- Type-level tests ensure the complex type transformations work correctly
- Integration tests verify the runtime behavior with actual tRPC routers
- Snapshot testing captures the generated RTK Query endpoint structure

## Current Development Priorities

Based on open GitHub issues, focus development efforts on:

**High Priority (Blocking/Important):**

1. **tRPC v11 Upgrade (#406)** - Major version update needed to stay current

   - Review migration guide: https://trpc.io/docs/v11/migration-guide
   - Update dependencies and test compatibility
   - Consider adopting new features (FormData support, streaming queries)

2. **Create Examples/Test Setups (#262)** - Critical for adoption
   - Separate repo backend/frontend setup
   - Shared monorepo setup
   - SPA (Single Page Application) example
   - Server-side rendering (SSR) example
   - React Native integration example

**Medium Priority (Quality & DX):** 3. **Improve Documentation (#44)** - Write comprehensive docs and improve README 4. **ESLint TypeScript Migration (#317)** - Convert flat config when ESLint stabilizes TS support 5. **E2E Testing (#43)** - Test built library version in real React projects

**Technical Debt:**

- Fix tagTypes type checking (#64)
- Improve endpoint options flow through proxy (#47)
- Add stricter validation for endpointOptions (#46)
- Fix queryFn typings (#41)
- Improve error typings for endpoints (#42)

## Known Issues & Gotchas

**TypeScript Complexity:**

- Advanced type transformations can cause "excessively deep instantiation" errors
- The `CreateEndpointDefinitions` type is particularly complex - modify carefully
- Type checking issues with tagTypes and endpoint options still exist

**Dependency Management:**

- Excellent automated updates via Dependabot (95%+ of recent PRs)
- Watch for major version compatibility issues (previous issues with pnpm versions)
- Support requires specific minimum versions: tRPC v10+, RTK Query v2+

**Development Workflow:**

- Last major feature development: June 2024 (ESLint 9 migration)
- Pattern: Bursts of development followed by maintenance-only phases
- Owner responsive to issues but development happens in cycles
