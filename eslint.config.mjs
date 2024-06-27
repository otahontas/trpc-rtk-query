import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier"; // TODO: add types
import eslintPluginPerfectionistRecommendedNatural from "eslint-plugin-perfectionist/configs/recommended-natural"; // TODO: add types
import eslintPluginUnicorn from "eslint-plugin-unicorn"; // TODO: add types (https://github.com/sindresorhus/eslint-plugin-unicorn/pull/2382)
import typescriptEslint from "typescript-eslint";

export default typescriptEslint.config(
  eslint.configs.recommended,
  eslintConfigPrettier,
  eslintPluginPerfectionistRecommendedNatural,
  eslintPluginUnicorn.configs["flat/recommended"],
  ...typescriptEslint.configs.recommended,
  {
    ignores: ["dist/*"],
  },
  {
    rules: {
      "no-console": "error",
    },
  },
  {
    files: ["**/test/**/*.ts", "**/test/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-console": "off",
      "unicorn/consistent-function-scoping": "off",
      "unicorn/no-null": "off",
      "unicorn/no-useless-undefined": "off",
    },
  },
);
