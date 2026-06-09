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
  transpilePackages: ["three", "@clinical/uterus", "@repo/ui", "@repo/clinical-3d"],
  experimental: {
    optimizePackageImports: ["lucide-react", "@react-three/drei"],
  },
  webpack: (config) => {
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
            key: "Content-Security-Policy",
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
    workboxOptions: {
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
