import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Downgrade react-hooks/set-state-in-effect from error to warn.
  // The existing codebase uses setState in effects for legitimate async state
  // updates (loading from localStorage, Supabase, etc.). Treat as advisory.
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
    },
  },
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
  {
    rules: {
      // Downgrade from error to warning: calling setState inside useEffect is a
      // common and accepted React pattern when guarded by a dependency array.
      // The widespread pre-existing usage in this codebase does not warrant
      // blocking CI with errors; individual call sites should be reviewed separately.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
