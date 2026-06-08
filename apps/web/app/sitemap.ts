import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const routes = ["", "/landing", "/pricing", "/login", "/register"];

  return routes.map((path) => ({
    url: `${base.replace(/\/$/, "")}${path === "" ? "/" : path}`,
    changeFrequency: path === "" || path === "/landing" ? "weekly" : "monthly",
    priority: path === "" || path === "/landing" ? 1 : 0.7,
  }));
}
