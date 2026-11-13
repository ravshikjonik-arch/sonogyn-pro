import { Suspense } from "react";
import type { Metadata } from "next";

import { CabinetBootScreen } from "@/components/clinical/CabinetBootScreen";
import { OpenAccessHomeClient } from "@/components/clinical/OpenAccessHomeClient";
import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

/**
 * Open-access cabinet entry. Soft-open demo; noindex — канон маркетинга на `/`.
 */
export const dynamic = "force-static";
export const revalidate = 60;
export const preferredRegion = "fra1";

export const metadata: Metadata = buildPublicMetadata({
  title: "Кабинет",
  description: "Демо-кабинет SonoGyn Pro для врачей УЗД и АГ.",
  path: "/home",
  noindex: true,
  skipCdsDisclaimer: true,
});

export default function OpenAccessHomePage() {
  return (
    <div data-testid="app-home">
      <h1 className="sr-only">Кабинет SonoGyn Pro</h1>
      <Suspense fallback={<CabinetBootScreen />}>
        <OpenAccessHomeClient />
      </Suspense>
    </div>
  );
}
