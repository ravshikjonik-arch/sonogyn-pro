"use client";

import { useOradsNavigator } from "@repo/orads-us";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { OradsAssistPanel } from "@/components/calculators/orads/wizard/OradsAssistPanel";
import { OradsWizardOptionButton } from "@/components/calculators/orads/wizard/OradsWizardOptionButton";
import { OradsWizardResultTabs } from "@/components/calculators/orads/wizard/OradsWizardResultTabs";
import { OradsWizardProgressBar } from "@/components/calculators/orads/wizard/OradsWizardUi";
import { Button } from "@/components/ui/button";
import { useOradsLocaleWeb } from "@/lib/orads-us/useOradsLocaleWeb";
import type { AdnexTriangulation } from "@repo/adnex-education";
import { saveOradsWizardBridgePayload } from "@/lib/reports/sre-orads-wizard-bridge";
import { cn } from "@/lib/utils/cn";

type Props = {
  onOpenPro?: () => void;
  className?: string;
};

/** O-RADS US v2022 stepper — `@repo/orads-us` decision tree only (T1.7). */
export function OradsUsWizard({ onOpenPro, className }: Props) {
  const locale = useOradsLocaleWeb("ru");
  const router = useRouter();
  const [mode, setMode] = useState<"stepper" | "assist">("stepper");

  const nav = useOradsNavigator({
    estimatedSteps: 6,
    translate: (key) => locale.t(key),
  });

  const view = nav.view;

  function goBack() {
    if (!nav.canPopStep && nav.state.path.length === 0) return;
    nav.back();
  }

  function openStructuredReport(triangulation: AdnexTriangulation) {
    if (view.kind !== "result") return;
    saveOradsWizardBridgePayload({
      path: nav.state.path,
      result: view.result,
      pathSummary: nav.pathSummary,
      triangulation,
    });
    router.push("/reports/adnex");
  }

  return (
    <div className={cn("mx-auto max-w-3xl space-y-4 px-4 py-6 lg:px-10", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-[var(--clinical-foreground-muted)]">
            {locale.t("orads.meta.version")}
          </p>
          <h2 className="text-xl font-black text-[var(--clinical-foreground)]">
            {locale.t("orads.wizard.title")}
          </h2>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={goBack} disabled={!nav.canPopStep}>
            {locale.t("orads.wizard.back")}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={nav.restart}>
            {locale.t("orads.wizard.restart")}
          </Button>
        </div>
      </div>

      <div className="flex gap-2 rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)] p-1">
        <Button
          type="button"
          size="sm"
          variant={mode === "stepper" ? "default" : "outline"}
          className="flex-1 rounded-lg"
          onClick={() => setMode("stepper")}
        >
          Пошагово
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "assist" ? "default" : "outline"}
          className="flex-1 rounded-lg"
          onClick={() => setMode("assist")}
        >
          Из описания
        </Button>
      </div>

      {mode === "assist" ? (
        <OradsAssistPanel nav={nav} />
      ) : null}

      {mode === "stepper" ? (
        <>
      <OradsWizardProgressBar current={nav.stepCurrent} total={nav.estimatedSteps} />
      <p className="text-sm font-bold text-[var(--clinical-foreground)]">
        {locale.t("orads.wizard.step_of", {
          current: String(nav.stepCurrent),
          total: String(nav.estimatedSteps),
        })}
      </p>

      {view.kind === "result" ? (
        <OradsWizardResultTabs
          path={nav.state.path}
          result={view.result}
          pathSummary={nav.pathSummary}
          locale={locale}
          onRestart={nav.restart}
          onBack={goBack}
          onBuildReport={openStructuredReport}
          onAskAscites={nav.startAscitesModifier}
        />
      ) : (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-black leading-snug text-[var(--clinical-foreground)]">
              {locale.t(view.node.questionKey)}
            </h3>
            {view.node.helpKey ? (
              <p className="mt-2 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
                {locale.t(view.node.helpKey)}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            {view.node.options.map((opt) => (
              <OradsWizardOptionButton
                key={opt.id}
                label={locale.t(opt.labelKey)}
                onClick={() => nav.pick(view.node.id, opt.id)}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-[var(--clinical-border)] pt-4">
            <Button type="button" variant="link" size="sm" className="h-auto p-0" asChild>
              <Link href="/tools/refs/orads-guide">Справка O-RADS →</Link>
            </Button>
            {onOpenPro ? (
              <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={onOpenPro}>
                {locale.t("orads.wizard.pro_link")}
              </Button>
            ) : null}
          </div>
        </div>
      )}

      <p className="text-xs text-[var(--clinical-foreground-muted)]">{locale.t("orads.meta.disclaimer")}</p>
        </>
      ) : null}
    </div>
  );
}
