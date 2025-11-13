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
    ignores: ["dist/*", "e2e/packages/client/dist/*", "e2e/packages/*/node_modules/*"],
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
  {
    files: ["e2e/**/*.ts", "e2e/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
      "perfectionist/sort-imports": "off",
      "perfectionist/sort-jsx-props": "off",
      "perfectionist/sort-named-imports": "off",
      "perfectionist/sort-objects": "off",
      "unicorn/catch-error-name": "off",
      "unicorn/filename-case": "off",
      "unicorn/numeric-separators-style": "off",
      "unicorn/prefer-query-selector": "off",
      "unicorn/prefer-spread": "off",
      "unicorn/prevent-abbreviations": "off",
    },
  },
);
