import type { CreateTRPCClientOptions } from "@trpc/client";

import { httpBatchLink } from "@trpc/client";
import { TRPCError, initTRPC } from "@trpc/server";

const t = initTRPC.create();

export const { procedure, router } = t;

type User = { id: number; name: string };

const database: Record<User["id"], User> = {
  1: { id: 1, name: "John" },
  2: { id: 2, name: "Jane" },
};

type ValidateTypeReturn<T extends "number" | "string"> = T extends "number"
  ? number
  : T extends "string"
  ? string
  : never;

function validateType(type: "string"): (input: unknown) => string;
function validateType(type: "number"): (input: unknown) => number;
function validateType(type: "number" | "string") {
  return (input: unknown): ValidateTypeReturn<typeof type> => {
    if (typeof input === type) {
      switch (type) {
        case "string": {
          return input as string;
        }
        case "number": {
          return input as number;
        }
        default: {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Not supported ${type}`,
          });
        }
      }
    }
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Bad input, expected ${type}, but was ${typeof input}`,
    });
  };
}

const flatAppRouter = router({
  // just for testing purposes, we don't actually care about the input
  updateName: procedure
    .input(() => ({
      id: 1,
      name: "Yolo Swaggins",
    }))
    .mutation(async (options) => {
      const { input } = options;
      if (!database[input.id]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      database[input.id]!.name = input.name;
    }),
  userById: procedure.input(validateType("number")).query(async (options) => {
    const { input } = options;
    // Retrieve the user with the given ID
    const user = database[input];
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }
    return { id: input, name: "John" };
  }),
  userCreate: procedure.input(validateType("string")).mutation(async (options) => {
    const { input } = options;
    const id = Math.max(...Object.values(database).map(({ id }) => id)) + 1;
    database[id] = {
      id,
      name: input,
    };
  }),
  userList: procedure.query(async () => Object.values(database)),
});

export type FlatAppRouter = typeof flatAppRouter;

export const tRPCClientOptions: CreateTRPCClientOptions<FlatAppRouter> = {
  links: [httpBatchLink({ url: "some-url" })],
};
