/**
 * Shared router type definition for E2E tests.
 *
 * This file exists to work around a TypeScript limitation where complex recursive
 * generic types don't resolve properly across package boundaries in some setups.
 *
 * In real consumer applications:
 * - Most setups DON'T hit this issue (single tsconfig project, or simpler routers)
 * - If they do, this same pattern (re-exporting types) is a valid workaround
 * - The runtime library works perfectly regardless of type resolution
 *
 * This matches the actual router implementation in ../server/router.ts
 */
import { initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();
const { procedure, router } = t;

export const appRouter = router({
  getUserById: procedure.input(z.number()).query(({ input }) => {
    return { id: input, name: `User ${input}` };
  }),

  listUsers: procedure.query(() => {
    return [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ];
  }),

  createUser: procedure.input(z.string().min(1)).mutation(({ input }) => {
    return { id: Date.now(), name: input };
  }),

  updateName: procedure
    .input(z.object({ id: z.number(), name: z.string().min(1) }))
    .mutation(({ input }) => {
      return { id: input.id, name: input.name };
    }),

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
