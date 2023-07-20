import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // TODO: fix
  // @ts-expect-error - started to fail after downgrading to react 16.9.0
  plugins: [react()],
  test: {
    environment: "happy-dom",
    typecheck: {
      exclude: ["dist/**/*"],
      ignoreSourceErrors: true, // these are checked during build
    },
  },
});
