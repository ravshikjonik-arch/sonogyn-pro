/**
 * PWA plugin options for next.config (CommonJS — loaded via createRequire from next.config.ts).
 */
const fs = require("fs");
const path = require("path");

const webRoot = path.join(__dirname, "..", "..");

/** Держать в sync с `lib/pwa/never-cache-url.ts` */
const NEVER_CACHE_PREFIXES = ["/api/", "/auth/", "/admin", "/patients", "/verify-phone", "/profile/patients"];

/** @param {URL} url @param {string} pathname */
function shouldNeverCacheRequest(url, pathname) {
  if (url.hostname.endsWith(".supabase.co")) return true;
  if (url.pathname.includes("/auth/v1") || url.href.includes("supabase.co/auth")) return true;
  for (const prefix of NEVER_CACHE_PREFIXES) {
    if (pathname === prefix.replace(/\/$/, "") || pathname.startsWith(prefix)) return true;
  }
  if (pathname.includes("verify-phone")) return true;
  return false;
}

function getPwaOfflinePrecachePaths() {
  const registryPath = path.join(webRoot, "lib/seo/calculator-seo-registry.ts");
  const text = fs.readFileSync(registryPath, "utf8");
  const fromRegistry = [...text.matchAll(/path:\s*"([^"]+)"/g)].map((m) => m[1]);
  const hubs = ["/", "/home", "/offline", "/app", "/dashboard", "/tools", "/tools/calc", "/tools/calc/rads/o-rads"];
  const seen = new Set();
  const out = [];
  for (const p of [...hubs, ...fromRegistry]) {
    if (seen.has(p)) continue;
    seen.add(p);
    out.push(p);
  }
  return out;
}

function buildRuntimeCaching() {
  return [
    {
      urlPattern: ({ url }) => shouldNeverCacheRequest(url, url.pathname),
      handler: "NetworkOnly",
      options: { cacheName: "sg-never-cache" },
    },
    {
      urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
      handler: "NetworkOnly",
      options: { cacheName: "sg-api-no-cache" },
    },
    {
      urlPattern: ({ url }) => url.pathname.startsWith("/_next/static/"),
      handler: "CacheFirst",
      options: {
        cacheName: "sg-static",
        expiration: { maxEntries: 256, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
    {
      urlPattern: ({ request }) =>
        request.destination === "style" || request.destination === "script" || request.destination === "font",
      handler: "CacheFirst",
      options: {
        cacheName: "sg-static",
        expiration: { maxEntries: 128, maxAgeSeconds: 60 * 60 * 24 * 30 },
      },
    },
    {
      urlPattern: ({ request, url }) =>
        request.mode === "navigate" && !shouldNeverCacheRequest(url, url.pathname),
      handler: "NetworkFirst",
      options: {
        cacheName: "sg-pages",
        networkTimeoutSeconds: 5,
        expiration: { maxEntries: 48, maxAgeSeconds: 60 * 60 * 24 * 7 },
      },
    },
    {
      urlPattern: ({ request, url }) =>
        request.destination === "image" && !shouldNeverCacheRequest(url, url.pathname),
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "sg-media",
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 14 },
      },
    },
  ];
}

function buildPwaPluginOptions() {
  const revision = process.env.VERCEL_GIT_COMMIT_SHA?.trim() || process.env.npm_package_version || "dev";
  const precachePaths = getPwaOfflinePrecachePaths();

  return {
    dest: "public",
    disable: process.env.DISABLE_PWA === "1",
    register: true,
    reloadOnOnline: false,
    cacheStartUrl: true,
    dynamicStartUrl: true,
    dynamicStartUrlRedirect: "/home",
    customWorkerSrc: "worker",
    sw: "/sw.js",
    fallbacks: { document: "/offline" },
    publicExcludes: ["!clinical-atlas/**/*", "!clinical/**/*", "!**/*.pdf", "!noprecache/**/*"],
    extendDefaultRuntimeCaching: true,
    workboxOptions: {
      skipWaiting: false,
      clientsClaim: true,
      cleanupOutdatedCaches: true,
      navigateFallback: null,
      navigateFallbackDenylist: [/^\/api\//, /^\/_next\//, /^\/auth\//, /^\/admin/, /^\/patients/],
      additionalManifestEntries: precachePaths.map((url) => ({ url, revision })),
      runtimeCaching: buildRuntimeCaching(),
    },
  };
}

module.exports = { buildPwaPluginOptions };
