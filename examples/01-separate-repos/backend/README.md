# tRPC Backend Example

This is the backend for the separate repositories example. It demonstrates how to set up a tRPC server using Express.

## Features

- **Express Server**: Simple HTTP server using Express
- **tRPC Router**: Type-safe API with queries and mutations
- **Mock Database**: In-memory database for demonstration
- **CORS Support**: Configured to allow requests from the frontend
- **TypeScript**: Fully typed codebase

## Project Structure

```
backend/
├── src/
│   ├── server.ts    # Express server setup
│   ├── router.ts    # tRPC router definition
│   └── db.ts        # Mock database
├── package.json
├── tsconfig.json
└── README.md
```

## Setup

1. Install dependencies:

```bash
npm install
# or
pnpm install
```

2. Start the development server:

```bash
npm run dev
# or
pnpm dev
```

The server will start on `http://localhost:3000` by default.

## Available Endpoints

### Users

- `user.list` - Get all users
- `user.getById` - Get a user by ID
- `user.create` - Create a new user
- `user.update` - Update an existing user
- `user.delete` - Delete a user

### Posts

- `post.list` - Get all posts (optionally filter by published status)
- `post.getById` - Get a post by ID
- `post.getByAuthor` - Get all posts by a specific author
- `post.create` - Create a new post
- `post.update` - Update an existing post
- `post.delete` - Delete a post

## Type Sharing

The `AppRouter` type is exported from `src/router.ts`. In a real application, you would share this type with your frontend through one of these methods:

1. **Publish as npm package**: Publish a shared types package that both backend and frontend depend on
2. **Monorepo**: Use a monorepo structure where types can be imported across packages
3. **Type generation**: Generate types on the backend and import them on the frontend

For this example, you'll need to manually copy the type or use a build step to make it available to the frontend.

## Production Build

1. Build the TypeScript code:

```bash
npm run build
# or
pnpm build
```

2. Start the production server:

```bash
npm start
# or
pnpm start
```

## Environment Variables

- `PORT` - Server port (default: 3000)

## Next Steps

- Configure the frontend to connect to this backend
- Add authentication and authorization
- Replace the mock database with a real database (PostgreSQL, MongoDB, etc.)
- Add validation and error handling
- Implement logging and monitoring
