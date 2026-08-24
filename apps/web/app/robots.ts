import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://sonogyn-pro.ru").replace(/\/$/, "");
  return {
    rules: {
      userAgent: "*",
      allow: "/",
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
    sitemap: `${base}/sitemap.xml`,
  };
}
