import type { MetadataRoute } from "next";

import { resolvePublicSiteUrl } from "@/lib/seo/build-public-metadata";

export default function robots(): MetadataRoute.Robots {
  const base = resolvePublicSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/app",
          "/login",
          "/register",
          "/auth/",
          "/verify-phone",
          "/patients",
          "/profile",
          "/paywall",
          "/dashboard",
          "/admin",
          "/author",
          "/workspace/",
          "/ai/workspace",
          "/ai/consultants/us-prep",
          "/tools/refs/ambulatory-intake",
          "/offline",
          "/home",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
