import type { ReactNode } from "react";

import { SessionRevalidationGuard } from "@/components/auth/SessionRevalidationGuard";
import { ClinicalChrome } from "@/components/clinical/ClinicalChrome";
import { getDevBypassProfile, getOpenAccessProfile } from "@/lib/auth/dev-account";

/** Europe: custom domain enters ARN1; IAD1 streaming hung mid-HTML. */
export const preferredRegion = "fra1";

export default function ClinicalLayout({ children }: { children: ReactNode }) {
  const devProfile = getDevBypassProfile() ?? getOpenAccessProfile();

  return (
    <SessionRevalidationGuard>
      <ClinicalChrome devProfile={devProfile}>{children}</ClinicalChrome>
    </SessionRevalidationGuard>
  );
}
