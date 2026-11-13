import type { MetadataRoute } from "next";

import { getIndexableSitemapRows } from "@/lib/seo/indexable-routes";
import { resolvePublicSiteUrl } from "@/lib/seo/build-public-metadata";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = resolvePublicSiteUrl();
  const lastModified = new Date();

  return getIndexableSitemapRows().map(({ path, priority, changeFrequency }) => ({
    url: `${base}${path === "/" ? "" : path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
