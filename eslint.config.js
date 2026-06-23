import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";

/**
 * Flat ESLint config for the Cute Planet idle clicker.
 *
 * Philosophy: this config is introduced onto a large, pre-existing codebase, so
 * most stylistic / non-critical rules are set to "warn" rather than "error" to
 * avoid a wall of blocking failures. Correctness-critical rules (react-hooks
 * rules-of-hooks, no-undef, etc.) stay as errors.
 */
export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "build/**",
      "coverage/**",
      "node_modules/**",
      ".agents/**",
      "*.config.js",
      "*.config.ts",
    ],
  },

  // Base JS + TypeScript recommendations.
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // App source (browser + React).
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.worker,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,

      // Keep the hooks dependency check loud but non-blocking on legacy code.
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // Pragmatic relaxations for the existing code (tighten incrementally).
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
      "@typescript-eslint/no-empty-object-type": "warn",
      "no-empty": ["warn", { allowEmptyCatch: true }],

      // a11y: keep as warnings on this visually-driven game UI.
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-noninteractive-element-interactions": "warn",
    },
  },

  // Node-side files (Express dev/prod server, build scripts).
  {
    files: ["server.ts", "*.ts"],
    ignores: ["src/**"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Test files.
  {
    files: ["**/*.test.{ts,tsx}", "src/test/**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
);
