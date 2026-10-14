import path from "node:path";
import { createRequire } from "node:module";

import type { NextConfig } from "next";

import { IA_V2_REDIRECTS } from "./lib/nav/ia-v2-redirects";

const requireFromWeb = createRequire(path.join(__dirname, "package.json"));

/**
 * Не импортируем `@ducanh2912/next-pwa` на верхнем уровне: при `next dev` Next
 * всё равно резолвит конфиг и тянет workbox → babel; при «разреженной» установке
 * pnpm часто сыпется MODULE_NOT_FOUND (`preset-modules`, `regenerator/visit.js`, …).
 * В development отдаём чистый nextConfig; PWA подключаем только для production build.
 */
type WithPWAFactory = (options: {
  dest: string;
  disable?: boolean;
  register?: boolean;
  workboxOptions?: {
    navigateFallback?: string | null;
    navigateFallbackDenylist?: RegExp[];
    runtimeCaching?: Array<{
      urlPattern: (ctx: { url: URL }) => boolean;
      handler: string;
      options?: { cacheName?: string };
    }>;
  };
}) => (config: NextConfig) => NextConfig;

function liveKitConnectExtra(): string {
  const raw = process.env.NEXT_PUBLIC_LIVEKIT_URL?.trim();
  if (!raw) return " wss://*.livekit.cloud https://*.livekit.cloud";
  try {
    const httpsOrigin = raw.startsWith("wss://")
      ? `https://${raw.slice("wss://".length).split("/")[0]}`
      : new URL(raw).origin;
    return ` ${raw} ${httpsOrigin} wss://*.livekit.cloud https://*.livekit.cloud`;
  } catch {
    return " wss://*.livekit.cloud https://*.livekit.cloud";
  }
}

function buildContentSecurityPolicy(): string {
  const isProd = process.env.NODE_ENV === "production";
  // Next inline theme/SW scripts still need 'unsafe-inline'. Drop 'unsafe-eval' in prod.
  const scriptSrc = isProd
    ? "script-src 'self' 'unsafe-inline' https://js.stripe.com https://challenges.cloudflare.com https://telegram.org https://www.googletagmanager.com https://www.google-analytics.com"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://challenges.cloudflare.com https://telegram.org https://www.googletagmanager.com https://www.google-analytics.com";

  const parts = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "font-src 'self' data:",
    "worker-src 'self' blob:",
    "img-src 'self' data: https://*.supabase.co https://telegram.org https://*.telesco.pe https://*.yandex.ru https://yastatic.net blob:",
    "media-src 'self' blob:",
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co${supabaseConnectOriginExtra()}${liveKitConnectExtra()} https://*.google-analytics.com https://www.google-analytics.com https://*.googleapis.com https://*.firebaseio.com https://firebasestorage.googleapis.com https://*.ingest.sentry.io https://challenges.cloudflare.com https://*.yandex.ru`,
    scriptSrc,
    "frame-src 'self' https://js.stripe.com https://challenges.cloudflare.com https://oauth.telegram.org https://disk.yandex.ru https://*.yandex.ru",
  ];
  if (isProd) parts.push("upgrade-insecure-requests");
  return `${parts.join("; ")};`;
}

function supabaseConnectOriginExtra(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return "";
  try {
    return ` ${new URL(raw).origin}`;
  } catch {
    return "";
  }
}

const nextConfig: NextConfig = {
  transpilePackages: [
    "three",
    "@clinical/uterus",
    "@repo/ui",
    "@repo/clinical-3d",
    "@repo/nosology",
    "@repo/cervix-pathology-reference",
    "@repo/musa-framework",
    "@repo/fmf",
    "@repo/obstetric-engine",
    "@repo/medical-calculations",
    "@repo/report-engine",
    "@repo/education-quiz",
    "@repo/evidence-retrieval",
    "@repo/adnex-education",
    "@repo/types",
    "@repo/orads-us",
    "@repo/birads-us",
    "@repo/birads-mmg",
  ],
  env: {
    // Mail-first: hide SMS/Telegram unless AUTH_ALLOW_PHONE=true.
    // OAuth UI: default on; set NEXT_PUBLIC_AUTH_SOCIAL_ENABLED=false only for incident rollback.
    NEXT_PUBLIC_AUTH_ALLOW_PHONE: process.env.AUTH_ALLOW_PHONE === "true" ? "true" : "false",
    NEXT_PUBLIC_AUTH_EMAIL_ONLY: process.env.AUTH_ALLOW_PHONE === "true" ? "false" : "true",
    NEXT_PUBLIC_AUTH_PILOT_CLOSED: process.env.AUTH_PILOT_TELEGRAM_ALLOWLIST?.trim() ? "true" : "false",
    // Mail-first pilot: OAuth UI off unless explicitly enabled (Yandex optional later).
    NEXT_PUBLIC_AUTH_SOCIAL_ENABLED:
      process.env.NEXT_PUBLIC_AUTH_SOCIAL_ENABLED === "true"
        ? "true"
        : process.env.AUTH_ALLOW_PHONE === "true"
          ? process.env.NEXT_PUBLIC_AUTH_SOCIAL_ENABLED === "false"
            ? "false"
            : "true"
          : "false",
    // Google Sign-In disabled (199-FZ / product policy).
    NEXT_PUBLIC_AUTH_GOOGLE_OAUTH_ENABLED: "false",
    NEXT_PUBLIC_SUPABASE_REDIRECT_URL:
      process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL?.trim() || "/auth/callback",
    NEXT_PUBLIC_OPEN_ACCESS_FULL:
      process.env.NEXT_PUBLIC_OPEN_ACCESS_FULL === "false" || process.env.OPEN_ACCESS_FULL === "false"
        ? "false"
        : "true",
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "@react-three/drei"],
  },
  webpack: (config) => {
    config.module ??= { rules: [] };
    config.module.rules ??= [];
    config.module.rules.push({
      test: /\.md$/i,
      type: "asset/source",
    });
    const clinical3dSrc = path.join(__dirname, "../../packages/clinical-3d/src");
    const packagesRoot = path.join(__dirname, "../../packages");
    config.resolve ??= {};
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
    };
    const servicesRoot = path.join(__dirname, "../../services");
    const medicalKnowledge = path.join(__dirname, "../../medical-knowledge");
    config.resolve.alias = {
      ...config.resolve.alias,
      "@repo/obstetric-expert-services": servicesRoot,
      "@medical-knowledge": path.join(medicalKnowledge, "index.ts"),
      "@repo/medical-calculations": path.join(packagesRoot, "medical-calculations/src/index.ts"),
      "@repo/report-engine": path.join(packagesRoot, "report-engine/src/index.ts"),
      "@repo/education-quiz": path.join(packagesRoot, "education-quiz/src/index.ts"),
      "@repo/evidence-retrieval": path.join(packagesRoot, "evidence-retrieval/src/index.ts"),
      "@repo/types": path.join(packagesRoot, "types/src/index.ts"),
      "@repo/birads-us": path.join(packagesRoot, "birads-us/src/index.ts"),
      "@repo/birads-mmg": path.join(packagesRoot, "birads-mmg/src/index.ts"),
      // Явные subpath для Vercel/webpack (wildcard exports из package.json не всегда резолвятся)
      "@repo/clinical-3d/organs/ovary": path.join(clinical3dSrc, "organs/ovary/index.ts"),
      "@repo/clinical-3d/shared/locale": path.join(clinical3dSrc, "shared/locale.ts"),
    };
    // pnpm hoists jay-peg at repo root; @react-pdf/image resolves from apps/web
    try {
      const jayPeg = requireFromWeb.resolve("jay-peg");
      config.resolve.alias = { ...config.resolve.alias, "jay-peg": jayPeg };
    } catch {
      /* optional peer of @react-pdf — pages without PDF export still work */
    }
    return config;
  },
  async redirects() {
    return IA_V2_REDIRECTS;
  },
  async headers() {
    const headers = [
      { key: "X-DNS-Prefetch-Control", value: "on" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(self), microphone=(self), geolocation=()",
      },
      {
        key: "Content-Security-Policy",
        value: buildContentSecurityPolicy(),
      },
    ];

    if (process.env.NODE_ENV === "production") {
      headers.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }

    return [
      {
        source: "/(.*)",
        headers,
      },
    ];
  },
};

export default ((): NextConfig => {
  const base =
    process.env.NODE_ENV === "development"
      ? nextConfig
      : (() => {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const withPWAInit = require("@ducanh2912/next-pwa").default as WithPWAFactory;
          const withPWA = withPWAInit({
            dest: "public",
            // Временно выключено: stale SW + precache ломали CSS после каждого деплоя (чёрный экран).
            disable: true,
            register: false,
            workboxOptions: {
              // App Router: fallback на /landing подменяет HTML для /login, /register и клиники → чёрный экран.
              navigateFallback: null,
              navigateFallbackDenylist: [/^\/api\//, /^\/_next\//, /^\/auth\//],
              runtimeCaching: [
                {
                  urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith("/api/"),
                  handler: "NetworkOnly",
                  options: { cacheName: "api-no-cache" },
                },
              ],
            },
          });
          return withPWA(nextConfig);
        })();

  return wrapSentryConfig(base);
})();

function wrapSentryConfig(config: NextConfig): NextConfig {
  const enabled = process.env.SENTRY_ENABLED?.trim().toLowerCase();
  if (enabled !== "1" && enabled !== "true") return config;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { withSentryConfig } = require("@sentry/nextjs") as {
    withSentryConfig: (cfg: NextConfig, opts: Record<string, unknown>) => NextConfig;
  };

  return withSentryConfig(config, {
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    authToken: process.env.SENTRY_AUTH_TOKEN,
    silent: !process.env.CI,
    widenClientFileUpload: true,
    hideSourceMaps: true,
    disableLogger: true,
    automaticVercelMonitors: false,
    release: {
      name: process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA,
    },
    sourcemaps: {
      deleteSourcemapsAfterUpload: true,
    },
  });
}
