"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";

import { CabinetBootScreen } from "@/components/clinical/CabinetBootScreen";

/** CI Playwright: skip heavy dynamic cabinet shell (dev chunk load can hang on boot screen). */
const e2eFixtures = process.env.NEXT_PUBLIC_E2E_FIXTURES === "true";

function E2eClinicalShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-dvh bg-[var(--clinical-bg)] text-[var(--clinical-foreground)]"
      data-e2e-clinical-shell
    >
      <main className="mx-auto w-full max-w-6xl">{children}</main>
    </div>
  );
}

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
const FirstRunOnboardingGate = dynamic(
  () =>
    import("@/components/onboarding/FirstRunOnboardingGate").then((mod) => mod.FirstRunOnboardingGate),
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
  if (e2eFixtures) {
    return <E2eClinicalShell>{children}</E2eClinicalShell>;
  }

  return (
    <>
      <ClinicalShell devProfile={devProfile}>{children}</ClinicalShell>
      <AchievementToastListener />
      <SonogynCopilot />
      <UpgradeModal />
      <FirstRunOnboardingGate />
    </>
  );
}
