/**
 * tRPC Router for SPA example
 */

import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "./db.js";

const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Todo router
const todoRouter = router({
  list: publicProcedure.query(async () => {
    return await db.todo.findAll();
  }),

  getById: publicProcedure.input(z.number()).query(async ({ input }) => {
    const todo = await db.todo.findById(input);
    if (!todo) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Todo with id ${input} not found`,
      });
    }
    return todo;
  }),

  getByUser: publicProcedure.input(z.number()).query(async ({ input }) => {
    return await db.todo.findByUser(input);
  }),

  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        userId: z.number(),
        completed: z.boolean().default(false),
      }),
    )
    .mutation(async ({ input }) => {
      return await db.todo.create(input);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        completed: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const todo = await db.todo.update(id, data);
      if (!todo) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Todo with id ${id} not found`,
        });
      }
      return todo;
    }),

  delete: publicProcedure.input(z.number()).mutation(async ({ input }) => {
    const deleted = await db.todo.delete(input);
    if (!deleted) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Todo with id ${input} not found`,
      });
    }
    return { success: true };
  }),

  toggleComplete: publicProcedure.input(z.number()).mutation(async ({ input }) => {
    const todo = await db.todo.findById(input);
    if (!todo) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Todo with id ${input} not found`,
      });
    }
    return await db.todo.update(input, { completed: !todo.completed });
  }),
});

// User router
const userRouter = router({
  list: publicProcedure.query(async () => {
    return await db.user.findAll();
  }),

  getById: publicProcedure.input(z.number()).query(async ({ input }) => {
    const user = await db.user.findById(input);
    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `User with id ${input} not found`,
      });
    }
    return user;
  }),
});

// Main app router
export const appRouter = router({
  todo: todoRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
