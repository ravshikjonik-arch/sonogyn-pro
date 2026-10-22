/**
 * Список precache-маршрутов (SSOT: offline-precache-routes.ts) без полной сборки.
 */
import { getPwaOfflinePrecachePaths } from "../lib/pwa/offline-precache-routes";

const paths = getPwaOfflinePrecachePaths();
const warnCount = Number(process.env.PWA_PRECACHE_WARN_ENTRIES ?? "80");
const maxCount = Number(process.env.PWA_PRECACHE_MAX_ENTRIES ?? "120");

console.log(`PWA precache URL entries (HTML routes): ${paths.length}`);
console.log(
  "После `next build --webpack`: `pnpm pwa:audit` — проверка sw.js; DevTools → Application → Cache Storage.",
);

if (paths.length > warnCount) {
  console.warn(
    `⚠️  ${paths.length} document URLs в additionalManifestEntries (>${warnCount}) — следите за размером precache.`,
  );
}

if (paths.length > maxCount) {
  console.error(`❌ Превышен лимит ${maxCount} precache entries.`);
  process.exitCode = 1;
}

paths.slice(0, 12).forEach((p) => console.log(`  • ${p}`));
if (paths.length > 12) console.log(`  … +${paths.length - 12} more`);
