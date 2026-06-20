import path from "node:path";
import { createRequire } from "node:module";

import type { NextConfig } from "next";

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
  transpilePackages: ["three", "@clinical/uterus", "@repo/ui", "@repo/clinical-3d", "@repo/nosology", "@repo/cervix-pathology-reference"],
  env: {
    NEXT_PUBLIC_AUTH_EMAIL_ONLY: process.env.AUTH_EMAIL_ONLY ?? "true",
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
    config.resolve ??= {};
    config.resolve.alias = {
      ...config.resolve.alias,
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
  async headers() {
    const headers = [
      { key: "X-DNS-Prefetch-Control", value: "on" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(self), geolocation=()",
      },
      {
        key: "Content-Security-Policy",
        value:
          `default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data: https://*.supabase.co https://telegram.org https://*.telesco.pe blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co${supabaseConnectOriginExtra()} https://*.google-analytics.com https://*.firebaseio.com https://firebasestorage.googleapis.com https://*.ingest.sentry.io https://challenges.cloudflare.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://challenges.cloudflare.com https://telegram.org; frame-src https://js.stripe.com https://challenges.cloudflare.com https://oauth.telegram.org;`,
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
  if (process.env.NODE_ENV === "development") {
    return nextConfig;
  }

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
