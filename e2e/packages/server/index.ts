import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { appRouter } from "./router.js";

const PORT = 3456;

export const server = createHTTPServer({
  router: appRouter,
  createContext: () => ({}),
});

export function startServer() {
  return new Promise<void>((resolve) => {
    server.listen(PORT, () => {
      console.log(`E2E tRPC server listening on http://localhost:${PORT}`);
      resolve();
    });
  });
}

export function stopServer() {
  return new Promise<void>((resolve) => {
    server.server.close(() => {
      console.log("E2E tRPC server stopped");
      resolve();
    });
  });
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
