// ESLint flat config (Next.js 15)
// Uses native flat config format to avoid FlatCompat circular reference issues

import nextPlugin from "@next/eslint-plugin-next";
import typescriptEslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs["recommended"].rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@next/next/no-img-element": "warn",
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "build/**",
      "public/**",
      "next-env.d.ts",
      // One-off dev helper used to generate the .resume-paper CSS resets
      // in globals.css (CommonJS script — deliberately not linted).
      "fix_resets.js",
    ],
  },
  ...typescriptEslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default eslintConfig;
