import type { ReactNode } from "react";
import dynamic from "next/dynamic";

import { SessionRevalidationGuard } from "@/components/auth/SessionRevalidationGuard";
import { CabinetBootScreen } from "@/components/clinical/CabinetBootScreen";
import { getDevBypassProfile, getOpenAccessProfile } from "@/lib/auth/dev-account";

/** Europe: custom domain enters ARN1; IAD1 streaming hung mid-HTML. */
export const preferredRegion = "fra1";

const ClinicalShell = dynamic(
  () => import("@/components/clinical/clinical-shell").then((mod) => mod.ClinicalShell),
  { ssr: false, loading: () => <CabinetBootScreen /> },
);
const AchievementToastListener = dynamic(
  () =>
    import("@/components/achievements/AchievementToastListener").then(
      (mod) => mod.AchievementToastListener,
    ),
  { ssr: false },
);
const SonogynCopilot = dynamic(
  () => import("@/components/ai/SonogynCopilot").then((mod) => mod.SonogynCopilot),
  { ssr: false },
);
const UpgradeModal = dynamic(
  () => import("@/components/pro/UpgradeModal").then((mod) => mod.UpgradeModal),
  { ssr: false },
);

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
