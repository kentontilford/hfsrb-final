import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  resolvePluginsRelativeTo: import.meta.dirname
});

export default [
  // ignore build dirs
  { ignores: ["node_modules/**", ".next/**", "drizzle/**", "coverage/**", "dist/**"] },

  // native flat presets
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // bring in Next rules via ESLintRC compatibility
  ...compat.config({
    extends: ["plugin:@next/next/core-web-vitals"],
    plugins: ["@next/next"] // <-- array of strings, not an object
  }),

  // project rules
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }]
    }
  },

  // prettier interop
  eslintConfigPrettier
];
