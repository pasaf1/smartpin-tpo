/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "react-hooks"],
  rules: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "error",
    "@next/next/no-img-element": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/ban-ts-comment": "warn",
    "no-restricted-syntax": [
      "error",
      { "selector": "TSNonNullExpression", "message": "אל תשתמש ב-! כדי לעקוף nullability" }
    ]
  },
  ignorePatterns: ["node_modules/", ".next/", "dist/", "build/"]
};
