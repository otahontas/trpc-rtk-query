import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createAppRouter } from "@trpc-rtk-example/shared";
import cors from "cors";
import express from "express";

// Mock database
const db = {
  product: {
    findAll: async () => [
      { id: 1, name: "Laptop", description: "Powerful laptop", price: 999, categoryId: 1, inStock: true, createdAt: new Date() },
    ],
    findById: async (id: number) => ({ id, name: "Laptop", description: "Powerful laptop", price: 999, categoryId: 1, inStock: true, createdAt: new Date() }),
    findByCategory: async (categoryId: number) => [],
    create: async (data: any) => ({ id: 2, ...data, createdAt: new Date() }),
    update: async (id: number, data: any) => ({ id, ...data }),
    delete: async (id: number) => true,
  },
  category: {
    findAll: async () => [{ id: 1, name: "Electronics", description: "Electronic devices" }],
    findById: async (id: number) => ({ id, name: "Electronics", description: "Electronic devices" }),
  },
};

const appRouter = createAppRouter(db);
export type AppRouter = typeof appRouter;

const app = express();
app.use(cors());
app.use("/trpc", createExpressMiddleware({ router: appRouter, createContext: () => ({}) }));

app.listen(3000, () => console.log("Backend running on http://localhost:3000"));
