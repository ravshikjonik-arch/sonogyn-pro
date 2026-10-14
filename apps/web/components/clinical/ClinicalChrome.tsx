"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";

import { CabinetBootScreen } from "@/components/clinical/CabinetBootScreen";

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

export function ClinicalChrome({
  children,
  devProfile = null,
}: {
  children: ReactNode;
  devProfile?: {
    email: string;
    full_name: string;
    specialization: string;
    institution: string;
  } | null;
}) {
  return (
    <>
      <ClinicalShell devProfile={devProfile}>{children}</ClinicalShell>
      <AchievementToastListener />
      <SonogynCopilot />
      <UpgradeModal />
    </>
  );
}
