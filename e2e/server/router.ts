import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create();

// Test data
const users = new Map([
  [1, { id: 1, name: 'Alice Johnson' }],
  [2, { id: 2, name: 'Bob Smith' }],
  [3, { id: 3, name: 'Charlie Brown' }],
]);

let nextId = 4;

// Define the router with various types of procedures
export const appRouter = t.router({
  // Basic query
  getUserById: t.procedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => {
      const user = users.get(input.id);
      if (!user) {
        throw new Error(`User with id ${input.id} not found`);
      }
      return user;
    }),

  // Query without input
  listUsers: t.procedure.query(() => {
    return Array.from(users.values());
  }),

  // Mutation
  createUser: t.procedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(({ input }) => {
      const newUser = { id: nextId++, name: input.name };
      users.set(newUser.id, newUser);
      return newUser;
    }),

  // Mutation with update
  updateUserName: t.procedure
    .input(z.object({ id: z.number(), name: z.string().min(1) }))
    .mutation(({ input }) => {
      const user = users.get(input.id);
      if (!user) {
        throw new Error(`User with id ${input.id} not found`);
      }
      user.name = input.name;
      return user;
    }),

  // Nested router
  nested: t.router({
    getMessage: t.procedure.query(() => {
      return { message: 'Hello from nested route' };
    }),

    deep: t.router({
      getVeryNestedMessage: t.procedure.query(() => {
        return { message: 'Hello from very nested route', level: 'deep' };
      }),

      echo: t.procedure
        .input(z.object({ text: z.string() }))
        .query(({ input }) => {
          return { echo: input.text };
        }),
    }),
  }),

  // Additional test procedures
  posts: t.router({
    getById: t.procedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => {
        return { id: input.id, title: `Post ${input.id}`, content: 'Content' };
      }),

    create: t.procedure
      .input(z.object({ title: z.string(), content: z.string() }))
      .mutation(({ input }) => {
        return { id: Math.floor(Math.random() * 1000), ...input };
      }),
  }),
});

export type AppRouter = typeof appRouter;
