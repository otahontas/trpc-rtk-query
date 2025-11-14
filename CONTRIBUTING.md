# Contributing to trpc-rtk-query

Thank you for your interest in contributing to trpc-rtk-query! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)
- [Release Process](#release-process)
- [Code of Conduct](#code-of-conduct)

## Getting Started

### Prerequisites

- **Node.js**: Version 20 or higher
- **pnpm**: Version 9.6.0 or higher (specified in `packageManager` field)

### Setup

1. **Fork and clone the repository**

```bash
git clone https://github.com/YOUR_USERNAME/trpc-rtk-query.git
cd trpc-rtk-query
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Verify your setup**

```bash
# Run tests
pnpm test

# Run type checking
pnpm run typecheck

# Run linting
pnpm run lint
```

If all commands complete successfully, you're ready to start developing!

## Development Workflow

### Making Changes

1. Create a new branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes in the appropriate files (see [Project Structure](#project-structure))

3. Write or update tests for your changes

4. Ensure all checks pass locally:
   ```bash
   # Run all tests
   pnpm test

   # Run tests with coverage
   pnpm run coverage

   # Type check your code
   pnpm run typecheck

   # Lint your code
   pnpm run lint

   # Build the library
   pnpm run build
   ```

### Running Tests

- **All tests**: `pnpm test`
- **Specific test**: `pnpm test <pattern>` (e.g., `pnpm test create-trpc-api`)
- **Type tests only**: `pnpm test -- --typecheck.only`
- **With coverage**: `pnpm run coverage`

The project uses [Vitest](https://vitest.dev/) for testing with the happy-dom environment.

### Type Checking

```bash
pnpm run typecheck
```

This runs TypeScript type checking via Vitest to ensure type safety across the codebase.

### Linting

```bash
pnpm run lint
```

This runs both ESLint and Prettier checks. The project uses:
- ESLint with TypeScript support
- Prettier for code formatting
- eslint-plugin-unicorn for additional code quality rules
- eslint-plugin-perfectionist for import/export sorting

See `eslint.config.mjs` for the complete ESLint configuration.

### Building

```bash
pnpm run build
```

This builds the library using [tsup](https://tsup.egoist.dev/) and generates both CommonJS and ESM outputs in the `dist/` directory.

## Code Standards

### TypeScript Best Practices

- Use strict TypeScript settings (project uses `@tsconfig/strictest`)
- Prefer type inference where possible
- Use explicit types for public APIs and exports
- Avoid using `any` - use `unknown` or proper types instead
- Keep complex type transformations well-documented with comments

### ESLint Rules

Key rules enforced in the project:
- **`no-console: error`** - No console statements in production code (allowed in tests)
- TypeScript recommended rules via `typescript-eslint`
- Unicorn plugin for code quality and modern JavaScript patterns
- Perfectionist plugin for consistent code organization

Test files have relaxed rules for pragmatic testing (see `eslint.config.mjs`).

### Testing Requirements

**All code changes must include tests:**

1. **Unit tests** for new functionality or bug fixes
   - Add tests in `test/` directory
   - Follow existing test patterns in `test/fixtures.ts`

2. **Type tests** for type-level changes
   - Use `.test-d.ts` files for TypeScript assertion testing
   - Ensure complex type transformations work correctly

3. **Integration tests** for end-to-end behavior
   - Test the full tRPC → RTK Query transformation
   - Verify runtime behavior matches type expectations

### Code Style

- Follow existing code patterns and conventions
- Use meaningful variable and function names
- Add comments for complex logic, especially in type transformations
- Keep functions focused and single-purpose
- Run `pnpm run lint` before committing

## Pull Request Process

### Before Submitting

1. **Create a changeset** (required for all user-facing changes):
   ```bash
   pnpm run changeset
   ```

   Follow the prompts to describe your changes. This is used for versioning and changelog generation.

2. **Ensure all checks pass**:
   - ✅ Tests pass (`pnpm test`)
   - ✅ Type checking passes (`pnpm run typecheck`)
   - ✅ Linting passes (`pnpm run lint`)
   - ✅ Build succeeds (`pnpm run build`)

3. **Commit your changes** with clear, descriptive commit messages

### Submitting Your PR

1. Push your branch to your fork
2. Open a pull request against the `main` branch
3. Fill out the PR template with:
   - **Clear description** of what changes you made and why
   - **Reference related issues** using `Fixes #123` or `Closes #123`
   - **Testing details** - how you tested your changes
   - **Breaking changes** - if any, describe migration path

4. **Wait for CI checks** - all automated checks must pass
5. **Respond to review feedback** - maintainers may request changes
6. **Keep your PR updated** - rebase if needed to resolve conflicts

### PR Guidelines

- Keep PRs focused on a single issue or feature
- Write clear, descriptive PR titles
- Update documentation if you're changing behavior
- Be patient - maintainers review PRs in their free time
- Be open to feedback and willing to make changes

## Project Structure

The codebase is organized as follows:

### Source Code (`src/`)

- **`api.ts`** - Main API with `enhanceApi()` and `createEmptyApi()` functions
- **`create-endpoint-definitions.ts`** - Complex TypeScript types that transform tRPC router types into RTK Query endpoint definitions
- **`wrap-api-to-proxy.ts`** - Proxy wrapper that dynamically creates RTK Query endpoints from tRPC client calls
- **`create-trpc-base-query.ts`** - Custom base query implementation for tRPC
- **`trpc-client-options.ts`** - Type definitions for tRPC client configuration

### Tests (`test/`)

- **`fixtures.ts`** - Comprehensive test tRPC router with nested routes, queries, and mutations
- **`*.test.ts`** - Runtime behavior tests
- **`*.test-d.ts`** - Type-level tests

### Where to Make Changes

- **Adding new features**: Start in `src/api.ts` or relevant module
- **Fixing type issues**: Look in `src/create-endpoint-definitions.ts`
- **Improving proxy behavior**: Check `src/wrap-api-to-proxy.ts`
- **Adding tests**: Add to `test/` directory, using `test/fixtures.ts` for test data

See [CLAUDE.md](./CLAUDE.md) for more detailed architecture documentation.

## Release Process

**Note**: Releases are handled by project maintainers.

The project uses [Changesets](https://github.com/changesets/changesets) for version management:

1. Contributors create changesets with their PRs (`pnpm run changeset`)
2. Maintainers review and merge PRs
3. Changesets are accumulated in the `.changeset/` directory
4. When ready to release, maintainers run `pnpm run release`
5. This builds the library and publishes to npm with an auto-generated changelog

## Code of Conduct

### Our Standards

- **Be respectful and collaborative** - Treat all contributors with respect
- **Be constructive** - Provide helpful feedback and be open to receiving it
- **Be patient** - This is an open-source project maintained by volunteers
- **Be inclusive** - Welcome contributors of all skill levels and backgrounds
- **Focus on the code** - Keep discussions technical and professional

### Reporting Issues

If you experience or witness unacceptable behavior, please contact the project maintainers.

---

## Questions?

- **Documentation**: See [README.md](./README.md) and [CLAUDE.md](./CLAUDE.md)
- **Issues**: Browse or create [GitHub Issues](https://github.com/otahontas/trpc-rtk-query/issues)
- **Discussions**: Start a [GitHub Discussion](https://github.com/otahontas/trpc-rtk-query/discussions)

Thank you for contributing to trpc-rtk-query! 🎉
