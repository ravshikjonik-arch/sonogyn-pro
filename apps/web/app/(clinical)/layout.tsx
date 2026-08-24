import type { ReactNode } from "react";

import { AchievementToastListener } from "@/components/achievements/AchievementToastListener";
import { SonogynCopilot } from "@/components/ai/SonogynCopilot";
import { SessionRevalidationGuard } from "@/components/auth/SessionRevalidationGuard";
import { ClinicalShell } from "@/components/clinical/clinical-shell";
import { UpgradeModal } from "@/components/pro/UpgradeModal";
import { getDevBypassProfile, getOpenAccessProfile } from "@/lib/auth/dev-account";

export default function ClinicalLayout({ children }: { children: ReactNode }) {
  const devProfile = getDevBypassProfile() ?? getOpenAccessProfile();

  return (
    <SessionRevalidationGuard>
      <ClinicalShell devProfile={devProfile}>{children}</ClinicalShell>
      <AchievementToastListener />
      <SonogynCopilot />
      <UpgradeModal />
    </SessionRevalidationGuard>
  );
}
