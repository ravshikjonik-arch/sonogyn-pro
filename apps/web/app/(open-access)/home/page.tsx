import { Suspense } from "react";

import { CabinetBootScreen } from "@/components/clinical/CabinetBootScreen";
import { OpenAccessHomeClient } from "@/components/clinical/OpenAccessHomeClient";

/**
 * Open-access cabinet entry. Same-origin SSR/assets by default.
 * Emergency CD bootstrap (SONOGYN_CUSTOM_DOMAIN_PROXY=1) is off unless re-enabled.
 */
export const dynamic = "force-static";
export const revalidate = 60;
export const preferredRegion = "fra1";

export default function OpenAccessHomePage() {
  return (
    <div data-testid="app-home">
      <Suspense fallback={<CabinetBootScreen />}>
        <OpenAccessHomeClient />
      </Suspense>
    </div>
  );
}
