import { httpBatchLink } from "@trpc/client";
import { TRPCError, initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();

const { procedure, router } = t;

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
});

type User = { id: number; name: string };

export const userFixtures: Record<User["id"], User> = {
  1: { id: 1, name: "John Johnny" },
  2: { id: 2, name: "Jane Janny" },
  3: { id: 3, name: "Yolo Swaggins" },
};

const veryDeepRouter = router({
  deep: router({
    getVeryNestedMessage: procedure
      .input(
        z.object({
          deepInput: z.string(),
        }),
      )
      .query(async (options) => {
        const {
          input: { deepInput },
        } = options;
        return {
          inputBack: deepInput,
          messageFromDeep: "Hello from deep",
        };
      }),
  }),
});

const extraProcedureInputSchema = z.object({
  bar: z.number(),
  foo: z.string(),
  nested: z.object({
    bar: z.number(),
    foo: z.string(),
  }),
});

export const appRouter = router({
  createUser: procedure.input(z.string()).mutation(async (options) => {
    const { input } = options;
    const id = Math.max(...Object.values(userFixtures).map(({ id }) => id)) + 1;
    userFixtures[id] = {
      id,
      name: input,
    };
  }),
  // Some extra procedures to see if stuff fails with bigger routers
  extraProcedure1: procedure
    .input(extraProcedureInputSchema)
    .query(async ({ input }) => input),
  extraProcedure2: procedure
    .input(extraProcedureInputSchema)
    .query(async ({ input }) => input),
  extraProcedure3: procedure
    .input(extraProcedureInputSchema)
    .query(async ({ input }) => input),
  extraProcedure4: procedure
    .input(extraProcedureInputSchema)
    .query(async ({ input }) => input),
  extraProcedure5: procedure
    .input(extraProcedureInputSchema)
    .query(async ({ input }) => input),
  extraProcedure6: procedure
    .input(extraProcedureInputSchema)
    .query(async ({ input }) => input),
  extraProcedure7: procedure
    .input(extraProcedureInputSchema)
    .query(async ({ input }) => input),
  extraProcedure8: procedure
    .input(extraProcedureInputSchema)
    .query(async ({ input }) => input),
  extraProcedure9: procedure
    .input(extraProcedureInputSchema)
    .query(async ({ input }) => input),
  extraProcedure10: procedure
    .input(extraProcedureInputSchema)
    .query(async ({ input }) => input),
  getUserById: procedure.input(z.number()).query(async (options) => {
    const { input } = options;
    // Retrieve the user with the given ID
    const user = userFixtures[input];
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }
    return user;
  }),
  listUsers: procedure.query(async () => Object.values(userFixtures)),
  nested: veryDeepRouter,
  updateName: procedure.input(userSchema).mutation(async (options) => {
    const { input } = options;
    if (!userFixtures[input.id]) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }
    userFixtures[input.id]!.name = input.name;
  }),
});

export type AppRouter = typeof appRouter;

export const testPort = 3333;

export const testClientOptions = {
  links: [httpBatchLink({ url: `http://localhost:${testPort}` })],
};
