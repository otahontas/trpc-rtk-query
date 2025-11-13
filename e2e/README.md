# E2E Tests for trpc-rtk-query

This directory contains end-to-end tests that verify the **built version** of the `trpc-rtk-query` library works correctly in a real React application.

## Overview

Unlike the unit and integration tests in `/test`, these E2E tests:

1. **Use the built library** from `/dist` (not source files)
2. **Run in a real browser** using Playwright
3. **Test a complete React application** with Vite, Redux, and tRPC
4. **Verify all features** work as expected in a production-like environment

## Structure

```
e2e/
├── server/           # tRPC server for E2E tests
│   ├── index.ts     # Server startup/shutdown
│   └── router.ts    # Test tRPC router with various procedures
├── client/          # React app that uses the built library
│   ├── src/
│   │   ├── App.tsx       # Main component using all library features
│   │   ├── main.tsx      # React entry point
│   │   └── store.ts      # Redux store with library setup
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── tests/           # Playwright E2E tests
│   ├── queries.spec.ts        # Tests for tRPC queries
│   ├── mutations.spec.ts      # Tests for tRPC mutations
│   └── built-library.spec.ts  # Verification of built library
├── package.json
├── playwright.config.ts
└── tsconfig.json
```

## Prerequisites

Before running E2E tests, you **must build the library**:

```bash
# From the project root
pnpm run build
```

This creates the `/dist` directory with the built library that the E2E tests will use.

## Running E2E Tests

### Install Dependencies

First, install dependencies for both the E2E tests and the client app:

```bash
# Install E2E test dependencies
cd e2e
pnpm install

# Install client app dependencies
cd client
pnpm install
cd ..
```

### Run Tests

```bash
# From the e2e directory
pnpm test
```

This will:
1. Start the tRPC server on port 3456
2. Start the Vite dev server on port 5173
3. Run Playwright tests in headless mode
4. Generate an HTML report

### Other Test Commands

```bash
# Run tests with UI mode (interactive)
pnpm test:ui

# Run tests in debug mode
pnpm test:debug

# Run only the server (for manual testing)
pnpm run server
```

## What the Tests Cover

### Queries (`queries.spec.ts`)
- ✅ Loading and displaying data from tRPC queries
- ✅ Query with input parameters
- ✅ Query without input parameters
- ✅ Error handling for failed queries
- ✅ Nested route queries (single level)
- ✅ Deeply nested route queries (multiple levels)
- ✅ Queries with input in nested routes

### Mutations (`mutations.spec.ts`)
- ✅ Creating new records via mutations
- ✅ Updating existing records
- ✅ Mutations in nested routers
- ✅ Sequential mutations
- ✅ Loading states during mutations
- ✅ Cache updates after mutations

### Built Library Verification (`built-library.spec.ts`)
- ✅ Verifies built library loads without errors
- ✅ Confirms TypeScript types work from `.d.ts` files
- ✅ Tests ESM module resolution
- ✅ Comprehensive test of all procedure types

## How It Verifies the Built Library

The E2E tests verify the built library by:

1. **Using `file:../..` protocol** in `client/package.json` to reference the parent directory
2. **Importing from `trpc-rtk-query`** which resolves to the built files in `/dist`
3. **Running in a real bundler** (Vite) that processes the built library like a real app would
4. **Testing in a real browser** with Playwright to catch runtime issues

This ensures the built library works correctly as it would for end users installing from npm.

## Updating Tests

When adding new features to the library:

1. Add corresponding procedures to `server/router.ts`
2. Use the new features in `client/src/App.tsx`
3. Write Playwright tests in `tests/` to verify the features work
4. Rebuild the library with `pnpm run build` from project root
5. Run E2E tests to verify

## CI Integration

To run E2E tests in CI:

```bash
# Install dependencies
pnpm install
cd e2e && pnpm install && cd client && pnpm install && cd ../..

# Build the library
pnpm run build

# Run E2E tests
cd e2e && pnpm test
```

## Troubleshooting

### "Cannot find module 'trpc-rtk-query'"

Make sure you've built the library first:
```bash
pnpm run build
```

### Tests timeout

The servers might take time to start. The configuration allows up to 120 seconds for server startup. If tests still timeout, check:
- Ports 3456 and 5173 are available
- Dependencies are installed in both `e2e/` and `e2e/client/`

### Type errors in client

Make sure the client's dependencies match the library's peer dependencies. Run:
```bash
cd client && pnpm install
```

## Local Development

For local development and debugging:

```bash
# Terminal 1: Start the tRPC server
cd e2e
pnpm run server

# Terminal 2: Start the client dev server
cd e2e/client
pnpm run dev

# Terminal 3: Run Playwright tests
cd e2e
pnpm test:ui  # Interactive mode
```

Then open http://localhost:5173 to see the app running with the built library.
