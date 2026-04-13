import { fixupConfigRules } from "@eslint/compat";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  {
    ignores: ["**/.next/**", "**/node_modules/**", "**/dist/**", "**/out/**"],
  },
  ...fixupConfigRules([...nextCoreWebVitals, ...nextTypescript]),
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "@next/next/no-img-element": "off",
      "no-console": ["warn", { allow: ["warn", "error", "debug", "info"] }],
    },
  },
];

export default config;
