import js from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import nextPlugin from "@next/eslint-plugin-next";
import prettier from "eslint-config-prettier";
import tailwind from "eslint-plugin-tailwindcss";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  {
    ignores: ["node_modules", ".next", "dist", "types"],
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "@next/next": nextPlugin,
      tailwindcss: tailwind,
      "react-hooks": reactHooks,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...prettier.rules,

      // Tailwind
      "tailwindcss/classnames-order": "warn",

      // TypeScript
      "@typescript-eslint/no-unused-vars": ["warn"], // cuma warning
      "@typescript-eslint/no-explicit-any": "off",   // biarin pake any
      "@typescript-eslint/explicit-module-boundary-types": "off",

      // React hooks
      "react-hooks/rules-of-hooks": "error",  // tetap error (krusial)
      "react-hooks/exhaustive-deps": "warn", // cukup warning

      // React 17+ / Next.js 13+
      "react/react-in-jsx-scope": "off",
    },
  },
];
