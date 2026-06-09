import type { ReactNode } from "react";

import { SessionRevalidationGuard } from "@/components/auth/SessionRevalidationGuard";
import { ClinicalShell } from "@/components/clinical/clinical-shell";
import { getDevBypassProfile } from "@/lib/auth/dev-account";

export default function ClinicalLayout({ children }: { children: ReactNode }) {
  const devProfile = getDevBypassProfile();

  return (
    <SessionRevalidationGuard>
      <ClinicalShell devProfile={devProfile}>{children}</ClinicalShell>
    </SessionRevalidationGuard>
  );
}
