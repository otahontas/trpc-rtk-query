/**
 * tRPC Router - Shared between backend and frontend
 */

import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";

const t = initTRPC.create();

export const router = t.router;
export const publicProcedure = t.procedure;

// Product router (implementation will be in backend)
export const createProductRouter = <TContext>(db: {
  product: {
    findAll: () => Promise<any[]>;
    findById: (id: number) => Promise<any>;
    findByCategory: (categoryId: number) => Promise<any[]>;
    create: (data: any) => Promise<any>;
    update: (id: number, data: any) => Promise<any>;
    delete: (id: number) => Promise<boolean>;
  };
}) =>
  router({
    list: publicProcedure.query(async () => {
      return await db.product.findAll();
    }),

    getById: publicProcedure.input(z.number()).query(async ({ input }) => {
      const product = await db.product.findById(input);
      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Product with id ${input} not found`,
        });
      }
      return product;
    }),

    getByCategory: publicProcedure.input(z.number()).query(async ({ input }) => {
      return await db.product.findByCategory(input);
    }),

    create: publicProcedure
      .input(
        z.object({
          name: z.string().min(1),
          description: z.string(),
          price: z.number().positive(),
          categoryId: z.number(),
          inStock: z.boolean().default(true),
        }),
      )
      .mutation(async ({ input }) => {
        return await db.product.create(input);
      }),

    update: publicProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().min(1).optional(),
          description: z.string().optional(),
          price: z.number().positive().optional(),
          inStock: z.boolean().optional(),
        }),
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const product = await db.product.update(id, data);
        if (!product) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Product with id ${id} not found`,
          });
        }
        return product;
      }),

    delete: publicProcedure.input(z.number()).mutation(async ({ input }) => {
      const deleted = await db.product.delete(input);
      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Product with id ${input} not found`,
        });
      }
      return { success: true };
    }),
  });

// Category router
export const createCategoryRouter = <TContext>(db: {
  category: {
    findAll: () => Promise<any[]>;
    findById: (id: number) => Promise<any>;
  };
}) =>
  router({
    list: publicProcedure.query(async () => {
      return await db.category.findAll();
    }),

    getById: publicProcedure.input(z.number()).query(async ({ input }) => {
      const category = await db.category.findById(input);
      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Category with id ${input} not found`,
        });
      }
      return category;
    }),
  });

// Type helper for creating the app router
export type CreateAppRouter<TContext = object> = ReturnType<
  typeof createAppRouter<TContext>
>;

export const createAppRouter = <TContext = object>(db: any) =>
  router({
    product: createProductRouter<TContext>(db),
    category: createCategoryRouter<TContext>(db),
  });
