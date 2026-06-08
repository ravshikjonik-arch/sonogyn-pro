import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // next-pwa / Workbox build artifacts (minified bundles).
    "public/**/*.js",
    // CommonJS scripts run with Node (not linted as TS modules).
    "scripts/**/*.js",
  ]),
]);

export default eslintConfig;
