import { initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();

// Destructure to match test fixtures pattern - important for type inference
const { procedure, router } = t;

// Test data
const users = new Map([
  [1, { id: 1, name: "Alice Johnson" }],
  [2, { id: 2, name: "Bob Smith" }],
  [3, { id: 3, name: "Charlie Brown" }],
]);

let nextId = 4;

// Define the router with various types of procedures
// Using similar patterns as library's test fixtures for best type inference
export const appRouter = router({
  // Basic query - using primitive input like test fixtures
  getUserById: procedure.input(z.number()).query(({ input }) => {
    const user = users.get(input);
    if (!user) {
      throw new Error(`User with id ${input} not found`);
    }
    return user;
  }),

  // Query without input
  listUsers: procedure.query(() => {
    return Array.from(users.values());
  }),

  // Mutation - using primitive input
  createUser: procedure.input(z.string().min(1)).mutation(({ input }) => {
    const newUser = { id: nextId++, name: input };
    users.set(newUser.id, newUser);
    return newUser;
  }),

  // Mutation with object input (matching test fixtures pattern)
  updateName: procedure
    .input(z.object({ id: z.number(), name: z.string().min(1) }))
    .mutation(({ input }) => {
      const user = users.get(input.id);
      if (!user) {
        throw new Error(`User with id ${input.id} not found`);
      }
      user.name = input.name;
      return user;
    }),

  // Nested router (matching test fixtures structure)
  nested: router({
    deep: router({
      getVeryNestedMessage: procedure
        .input(z.object({ deepInput: z.string() }))
        .query(({ input }) => {
          return { inputBack: input.deepInput, messageFromDeep: "Hello from deep" };
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
