/**
 * Express server with tRPC
 */

import { createExpressMiddleware } from "@trpc/server/adapters/express";
import cors from "cors";
import express from "express";
import { appRouter } from "./router.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins (configure as needed for production)
app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// tRPC middleware
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: () => ({}), // Add context if needed (auth, db, etc.)
  }),
);

app.listen(PORT, () => {
  console.log(`
  ✅ Server is running!

  🚀 tRPC endpoint: http://localhost:${PORT}/trpc
  🏥 Health check:  http://localhost:${PORT}/health
  `);
});
