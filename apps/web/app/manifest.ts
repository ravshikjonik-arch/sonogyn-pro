import type { MetadataRoute } from "next";

import { buildWebAppManifest } from "@/lib/pwa/site-manifest";

/** PWA manifest (SW — см. next.config.ts, шаг 2). */
export default function manifest(): MetadataRoute.Manifest {
  return buildWebAppManifest();
}
