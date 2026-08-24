import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://sonogyn-pro.ru").replace(/\/$/, "");
  const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] =
    [
      { path: "", priority: 1, changeFrequency: "weekly" },
      { path: "/landing", priority: 1, changeFrequency: "weekly" },
      { path: "/home", priority: 0.9, changeFrequency: "weekly" },
      { path: "/privacy", priority: 0.5, changeFrequency: "monthly" },
      { path: "/pricing", priority: 0.6, changeFrequency: "monthly" },
    ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path === "" ? "/" : path}`,
    changeFrequency,
    priority,
  }));
}
