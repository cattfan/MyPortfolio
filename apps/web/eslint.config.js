import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextJsConfig,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        babelOptions: {
          presets: [],
          parserOpts: { plugins: ["typescript", "jsx"] },
        },
      },
    },
    rules: { "no-undef": "off", "no-unused-vars": "off" },
  },
  {
    files: ["scripts/**/*.mjs", "*.config.*"],
    languageOptions: {
      globals: {
        process: "readonly",
        Buffer: "readonly",
        console: "readonly",
        URL: "readonly",
      },
    },
  },
  {
    files: ["playwright.config.ts", "tests/**/*.ts"],
    rules: { "turbo/no-undeclared-env-vars": "off" },
  },
];
