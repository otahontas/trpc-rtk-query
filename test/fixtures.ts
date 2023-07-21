import { httpBatchLink } from "@trpc/client";
import { TRPCError, initTRPC } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();

export const { procedure, router } = t;

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export type User = { id: number; name: string };

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

export const appRouter = router({
  createUser: procedure.input(z.string()).mutation(async (options) => {
    const { input } = options;
    const id = Math.max(...Object.values(userFixtures).map(({ id }) => id)) + 1;
    userFixtures[id] = {
      id,
      name: input,
    };
  }),
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
