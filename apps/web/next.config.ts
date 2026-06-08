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
type WithPWAFactory = (options: { dest: string; disable?: boolean; register?: boolean }) => (config: NextConfig) => NextConfig;

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
  transpilePackages: ["three", "@clinical/uterus", "@repo/ui", "@repo/clinical-3d"],
  experimental: {
    optimizePackageImports: ["lucide-react", "@react-three/drei"],
  },
  webpack: (config) => {
    // pnpm hoists jay-peg at repo root; @react-pdf/image resolves from apps/web
    try {
      const jayPeg = requireFromWeb.resolve("jay-peg");
      config.resolve ??= {};
      config.resolve.alias = { ...config.resolve.alias, "jay-peg": jayPeg };
    } catch {
      /* optional peer of @react-pdf — pages without PDF export still work */
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=()",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value:
              `default-src 'self'; img-src 'self' data: https://*.supabase.co blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co${supabaseConnectOriginExtra()} https://*.google-analytics.com https://*.firebaseio.com https://firebasestorage.googleapis.com https://*.ingest.sentry.io; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; frame-src https://js.stripe.com;`,
          },
        ],
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
    disable: false,
    register: true,
  });
  return withPWA(nextConfig);
})();
