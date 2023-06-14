/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { CreateTRPCClientOptions } from "@trpc/client";

import { httpBatchLink } from "@trpc/client";
import { TRPCError, initTRPC } from "@trpc/server";
import { createHTTPServer } from "@trpc/server/adapters/standalone";
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

const flatAppRouter = router({
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

export type FlatAppRouter = typeof flatAppRouter;

const testPort = 3333;

export const tRPCClientOptions: CreateTRPCClientOptions<FlatAppRouter> = {
  links: [httpBatchLink({ url: `http://localhost:${testPort}` })],
};
interface TestServer {
  close: () => Promise<void>;
}

export const startTestServer = (): Promise<TestServer> =>
  new Promise((resolveCreate) => {
    const { server } = createHTTPServer({
      router: flatAppRouter,
    });

    const closePromise = (): Promise<void> =>
      new Promise((resolveClose, rejectClose) => {
        server.close((error) => {
          if (error) {
            console.error("Failed to close test server!");
            rejectClose(error);
            return;
          }
          resolveClose();
        });
      });

    server.listen(testPort, () => {
      console.log("Test server listening!");
      resolveCreate({
        close: closePromise,
      });
    });
  });
