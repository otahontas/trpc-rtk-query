/**
 * Express server for SPA example
 */

import { createExpressMiddleware } from "@trpc/server/adapters/express";
import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { appRouter } from "./router.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// tRPC endpoint
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: () => ({}),
  }),
);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  const clientBuildPath = path.join(__dirname, "../client");
  app.use(express.static(clientBuildPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`
  ✅ Server is running on http://localhost:${PORT}

  ${process.env.NODE_ENV === "production"
    ? "📦 Serving production build"
    : "🔧 Running in development mode"
  }
  `);
});
