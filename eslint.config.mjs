import eslint from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

export default [
    {
        ignores: [
            ".tmp/**",
            ".next/**",
            "node_modules/**",
            ".open-next/**",
            ".wrangler/**",
            "cloudflare-env.d.ts",
            "next-env.d.ts",
            "public/**",
        ],
    },
    {
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            ecmaVersion: "latest",
            globals: {
                ...globals.browser,
                ...globals.es2022,
                ...globals.node,
            },
            parser: tsParser,
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
                sourceType: "module",
            },
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
            "react-hooks": reactHooks,
        },
        rules: {
            ...eslint.configs.recommended.rules,
            "react-hooks/exhaustive-deps": "warn",
            "react-hooks/rules-of-hooks": "error",
            "no-undef": "off",
            "no-unused-vars": "off",
        },
    },
];
