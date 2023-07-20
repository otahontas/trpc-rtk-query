import { defineConfig } from "tsup";

export default defineConfig({
  format: ["cjs", "esm"],
  minify: true,
  treeshake: true,
  tsconfig: "./tsconfig.build.json",
});
