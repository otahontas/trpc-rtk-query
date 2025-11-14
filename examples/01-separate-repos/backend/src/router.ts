/**
 * tRPC Router Definition
 * This defines all the procedures (queries and mutations) available via tRPC
 */

import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";
import { db } from "./db.js";

// Initialize tRPC
const t = initTRPC.create();

// Export reusable router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;

// User procedures
const userRouter = router({
  list: publicProcedure.query(async () => {
    return await db.user.findMany();
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

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ input }) => {
      return await db.user.create(input);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const user = await db.user.update(id, data);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `User with id ${id} not found`,
        });
      }
      return user;
    }),

  delete: publicProcedure.input(z.number()).mutation(async ({ input }) => {
    const deleted = await db.user.delete(input);
    if (!deleted) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `User with id ${input} not found`,
      });
    }
    return { success: true };
  }),
});

// Post procedures
const postRouter = router({
  list: publicProcedure
    .input(
      z
        .object({
          published: z.boolean().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      return await db.post.findMany(input);
    }),

  getById: publicProcedure.input(z.number()).query(async ({ input }) => {
    const post = await db.post.findById(input);
    if (!post) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Post with id ${input} not found`,
      });
    }
    return post;
  }),

  getByAuthor: publicProcedure.input(z.number()).query(async ({ input }) => {
    return await db.post.findByAuthor(input);
  }),

  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string(),
        authorId: z.number(),
        published: z.boolean().default(false),
      }),
    )
    .mutation(async ({ input }) => {
      return await db.post.create(input);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        content: z.string().optional(),
        published: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const post = await db.post.update(id, data);
      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Post with id ${id} not found`,
        });
      }
      return post;
    }),

  delete: publicProcedure.input(z.number()).mutation(async ({ input }) => {
    const deleted = await db.post.delete(input);
    if (!deleted) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Post with id ${input} not found`,
      });
    }
    return { success: true };
  }),
});

// Main app router that combines all routers
export const appRouter = router({
  user: userRouter,
  post: postRouter,
});

// Export type definition of the API
export type AppRouter = typeof appRouter;
