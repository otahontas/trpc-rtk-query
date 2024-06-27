import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  format: ["cjs", "esm"],
  minify: true,
  sourcemap: true,
  treeshake: true,
  tsconfig: "./tsconfig.build.json",
});
