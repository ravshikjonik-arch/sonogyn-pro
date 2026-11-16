"use client";

import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";

import { CabinetBootScreen } from "@/components/clinical/CabinetBootScreen";
import { NetworkProvider } from "@/components/network/NetworkProvider";

/** CI Playwright: skip heavy dynamic cabinet shell (dev chunk load can hang on boot screen). */
const e2eFixtures = process.env.NEXT_PUBLIC_E2E_FIXTURES === "true";

function E2eClinicalShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-dvh bg-[var(--clinical-bg)] text-[var(--clinical-foreground)]"
      data-e2e-clinical-shell
    >
      <main id="main-content" className="mx-auto w-full max-w-6xl">
        {children}
      </main>
    </div>
  );
}

/** SSR on: public tool pages need real H1/content in HTML (SEO). Shell stays client; children stream. */
const ClinicalShell = dynamic(
  () => import("@/components/clinical/clinical-shell").then((mod) => mod.ClinicalShell),
  { loading: () => <CabinetBootScreen /> },
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

/** Defer heavy cabinet widgets until idle or first user gesture (faster first paint). */
function useDeferredCabinetExtras(enabled: boolean) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!enabled || ready) return;
    let done = false;
    const arm = () => {
      if (done) return;
      done = true;
      setReady(true);
    };
    const onInteract = () => arm();
    window.addEventListener("pointerdown", onInteract, { once: true, passive: true });
    window.addEventListener("keydown", onInteract, { once: true });
    const ric = window.requestIdleCallback?.(arm, { timeout: 3500 });
    const t = window.setTimeout(arm, 4000);
    return () => {
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      if (ric != null && window.cancelIdleCallback) window.cancelIdleCallback(ric);
      window.clearTimeout(t);
    };
  }, [enabled, ready]);
  return ready;
}

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
  const extrasReady = useDeferredCabinetExtras(!e2eFixtures);

  if (e2eFixtures) {
    return <E2eClinicalShell>{children}</E2eClinicalShell>;
  }

  return (
    <NetworkProvider>
      <ClinicalShell devProfile={devProfile}>{children}</ClinicalShell>
      <AchievementToastListener />
      {extrasReady ? (
        <>
          <SonogynCopilot />
          <UpgradeModal />
          <FirstRunOnboardingGate />
        </>
      ) : null}
    </NetworkProvider>
  );
}
