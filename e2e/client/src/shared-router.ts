// Shared tRPC router for E2E tests
// This file is in the same package as the client to ensure proper TypeScript type resolution
import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create();

// Destructure to match library test fixtures pattern
const { procedure, router } = t;

// Define the router with various types of procedures
export const appRouter = router({
  // Basic query - using primitive input like test fixtures
  getUserById: procedure
    .input(z.number())
    .query(({ input }) => {
      // In real E2E tests, this would hit the actual server
      return { id: input, name: `User ${input}` };
    }),

  // Query without input
  listUsers: procedure.query(() => {
    return [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
  }),

  // Mutation - using primitive input
  createUser: procedure
    .input(z.string().min(1))
    .mutation(({ input }) => {
      return { id: Date.now(), name: input };
    }),

  // Mutation with object input (matching test fixtures pattern)
  updateName: procedure
    .input(z.object({ id: z.number(), name: z.string().min(1) }))
    .mutation(({ input }) => {
      return { id: input.id, name: input.name };
    }),

  // Nested router (matching test fixtures structure)
  nested: router({
    deep: router({
      getVeryNestedMessage: procedure
        .input(z.object({ deepInput: z.string() }))
        .query(({ input }) => {
          return { inputBack: input.deepInput, messageFromDeep: 'Hello from deep' };
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
