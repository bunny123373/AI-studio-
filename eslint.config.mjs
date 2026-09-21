import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Next.js 16 flat ESLint config.
 * The `next lint` command was removed in Next 16 — run `npm run lint`
 * (ESLint CLI) directly instead.
 */
const eslintConfig = defineConfig([
  // Generated / vendored files — never lint these.
  globalIgnores([".next/**", "node_modules/**", "out/**", "next-env.d.ts"]),
  ...nextVitals,
  ...nextTs,
]);

export default eslintConfig;