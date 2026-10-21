import type { ReactNode } from "react";

import { SessionRevalidationGuard } from "@/components/auth/SessionRevalidationGuard";
import { ClinicalChrome } from "@/components/clinical/ClinicalChrome";
import { getDevBypassProfile, getOpenAccessProfile, isFullOpenAccessEnabled } from "@/lib/auth/dev-account";

/** Europe: custom domain enters ARN1; IAD1 streaming hung mid-HTML. */
export const preferredRegion = "fra1";

export default function ClinicalLayout({ children }: { children: ReactNode }) {
  // Open access: не подставляем технический open-access@ в шапку — только баннер «без входа».
  const devProfile = isFullOpenAccessEnabled()
    ? null
    : getDevBypassProfile() ?? getOpenAccessProfile();

  return (
    <SessionRevalidationGuard>
      <ClinicalChrome devProfile={devProfile}>{children}</ClinicalChrome>
    </SessionRevalidationGuard>
  );
}
