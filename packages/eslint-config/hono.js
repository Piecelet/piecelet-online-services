import { config as baseConfig } from "./base.js";

/**
 * A custom ESLint configuration for Hono applications.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  ...baseConfig,
  {
    rules: {
      // Hono-specific rules
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    ignores: [
      ".wrangler/**",
      "dist/**",
      "build/**",
      "*.config.js",
      "*.config.ts",
    ],
  },
];
