import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    allConfig: js.configs.all,
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended
});

export default [{
    ignores: ["**/dist/", "**/node_modules/", "**/.git/", "**/pnpm-lock.yaml"],
}, ...compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
    "plugin:unicorn/recommended",
    "plugin:perfectionist/recommended-natural",
), {
    languageOptions: {
        parser: tsParser,
    },

    plugins: {
        "@typescript-eslint": typescriptEslint,
    },

    rules: {
        "no-console": "error",
    },
}, {
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
}];
