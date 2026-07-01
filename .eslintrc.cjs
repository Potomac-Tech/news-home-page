module.exports = {
    root: true,
    env: {
        browser: true,
        es2022: true,
        node: true,
    },
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        ecmaVersion: "latest",
        sourceType: "module",
    },
    plugins: ["@typescript-eslint", "react-hooks"],
    extends: ["eslint:recommended", "plugin:react-hooks/recommended"],
    ignorePatterns: [
        ".next/",
        "dist/",
        "node_modules/",
        "next-app/.next/",
        "next-app/next-env.d.ts",
        "next-app/public/",
        "public/",
    ],
    rules: {
        "no-undef": "off",
        "no-unused-vars": "off",
    },
    settings: {
        react: {
            version: "detect",
        },
    },
};
