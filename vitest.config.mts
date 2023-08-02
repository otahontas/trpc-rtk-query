import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    typecheck: {
      exclude: ["dist/**/*"],
      ignoreSourceErrors: true, // these are checked during build
    },
  },
});
