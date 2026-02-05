import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default [
  {
    ignores: ["**/.next/**", "**/node_modules/**", "**/dist/**", "**/out/**"],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      // This rule is too strict for this codebase today (flags common, safe patterns).
      "react-hooks/set-state-in-effect": "off",
      // Prefer explicit defaults, but don't block lint on config style.
      "import/no-anonymous-default-export": "off",
      // Warn on console.log (use logger instead); allow warn/error
      "no-console": ["warn", { allow: ["warn", "error", "debug"] }],
    },
  },
];
