import type { MetadataRoute } from "next";

import { resolvePublicSiteUrl } from "@/lib/seo/build-public-metadata";

export default function robots(): MetadataRoute.Robots {
  const base = resolvePublicSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/landing", "/home", "/pricing", "/privacy", "/lp/", "/tools/", "/ai/consultants/fmf"],
        disallow: [
          "/api/",
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
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
