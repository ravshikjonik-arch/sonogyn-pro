"use client";

import { useOradsNavigator } from "@repo/orads-us";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, MoreHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

import { OradsAssistPanel } from "@/components/calculators/orads/wizard/OradsAssistPanel";
import { OradsAcrResultBadge } from "@/components/calculators/orads/wizard/OradsAcrResultBadge";
import { OradsWizardAtlasImage } from "@/components/calculators/orads/wizard/OradsWizardAtlasImage";
import { OradsWizardOptionButton } from "@/components/calculators/orads/wizard/OradsWizardOptionButton";
import { OradsWizardResultTabs } from "@/components/calculators/orads/wizard/OradsWizardResultTabs";
import { ClinicalCdssDisclaimer } from "@/components/clinical/ClinicalCdssDisclaimer";
import { OradsUnifiedCalculator } from "@/components/calculators/orads/OradsUnifiedCalculator";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { resolveOradsAtlasPreview } from "@/lib/orads-us/resolveOradsAtlasPreview";
import { useOradsLocaleWeb } from "@/lib/orads-us/useOradsLocaleWeb";
import type { AdnexTriangulation } from "@repo/adnex-education";
import { saveOradsWizardBridgePayload } from "@/lib/reports/sre-orads-wizard-bridge";
import { cn } from "@/lib/utils/cn";

type Props = {
  onOpenTables: () => void;
  onOpenResources: () => void;
  className?: string;
};

/** O-RADS US — пошаговый UI как в ACR App (дерево v2022). */
export function OradsAcrWizardExperience({ onOpenTables, onOpenResources, className }: Props) {
  const locale = useOradsLocaleWeb("ru");
  const router = useRouter();
  const [showStratifyForm, setShowStratifyForm] = useState(false);
  const [assistOpen, setAssistOpen] = useState(false);

  const nav = useOradsNavigator({
    estimatedSteps: 6,
    translate: (key) => locale.t(key),
  });

  const view = nav.view;

  const breadcrumb = useMemo(() => {
    if (!nav.pathSummary.length) return ["Ovarian/Adnexal"];
    return ["Ovarian/Adnexal", ...nav.pathSummary];
  }, [nav.pathSummary]);

  const stepAtlasPreview = useMemo(() => {
    if (view.kind !== "question") return null;
    return resolveOradsAtlasPreview(view.node.imageRef);
  }, [view]);

  function goBack() {
    if (assistOpen) {
      setAssistOpen(false);
      return;
    }
    if (!nav.canPopStep && nav.state.path.length === 0) {
      router.push("/tools/calc");
      return;
    }
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

  if (showStratifyForm) {
    return (
      <div className={className}>
        <div className="border-b border-[var(--clinical-border)] bg-[var(--clinical-muted)]/40 px-4 py-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setShowStratifyForm(false)}>
            ← К пошаговому O-RADS (ACR)
          </Button>
        </div>
        <OradsUnifiedCalculator />
      </div>
    );
  }

  return (
    <div
      className={cn("relative mx-auto flex min-h-[calc(100dvh-4rem)] max-w-lg flex-col pb-28", className)}
      data-e2e-orads-acr-wizard
    >
      <header className="bg-[var(--clinical-primary)] text-[var(--clinical-primary-foreground)] shadow-sm">
        <div className="flex items-center gap-2 px-3 py-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full text-inherit hover:bg-white/15"
            onClick={goBack}
            aria-label={locale.t("orads.wizard.back")}
          >
            <ChevronLeft className="h-6 w-6" aria-hidden />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{locale.t("orads.meta.version")}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full text-inherit hover:bg-white/15"
                aria-label="Дополнительно"
              >
                <MoreHorizontal className="h-5 w-5" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => nav.restart()}>{locale.t("orads.wizard.restart")}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setAssistOpen(true)}>Из описания протокола</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setShowStratifyForm(true)}>Стратификация (форма v2022)</DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/tools/refs/orads-guide">Руководство O-RADS</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <nav
        className="border-b border-[var(--clinical-border)] bg-[var(--clinical-card)] px-4 py-2 text-xs leading-relaxed text-[var(--clinical-link)]"
        aria-label="Путь оценки"
      >
        <p className="line-clamp-2">{breadcrumb.join(" › ")}</p>
      </nav>

      <main className="flex-1 px-4 py-6">
        {assistOpen ? (
          <OradsAssistPanel nav={nav} />
        ) : view.kind === "result" ? (
          <div className="space-y-6">
            <OradsAcrResultBadge result={view.result} romLabel={locale.t("orads.wizard.rom_label")} />
            <div className="space-y-3 rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4 text-sm leading-relaxed">
              {view.result.rationaleKey ? (
                <p className="text-[var(--clinical-foreground-muted)]">• {locale.t(view.result.rationaleKey)}</p>
              ) : null}
              <p className="font-medium text-[var(--clinical-foreground)]">{locale.t(view.result.managementKey)}</p>
            </div>
            <Button type="button" className="w-full rounded-full py-6 text-base" onClick={nav.restart}>
              Новое образование
            </Button>
            <details className="rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/30">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium">IOTA и протокол</summary>
              <div className="border-t border-[var(--clinical-border)] p-3">
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
              </div>
            </details>
            <ClinicalCdssDisclaimer />
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-semibold leading-snug text-[var(--clinical-foreground)]">
                {locale.t(view.node.questionKey)}
              </h2>
              {view.node.helpKey ? (
                <p className="mt-3 rounded-lg bg-[var(--clinical-muted)]/50 px-3 py-2 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
                  {locale.t(view.node.helpKey)}
                </p>
              ) : null}
            </div>

            <OradsWizardAtlasImage preview={stepAtlasPreview} />

            <div className="space-y-2.5">
              {view.node.options.map((opt) => (
                <OradsWizardOptionButton
                  key={opt.id}
                  label={locale.t(opt.labelKey)}
                  variant="acr"
                  onClick={() => nav.pick(view.node.id, opt.id)}
                  imageSlot={
                    opt.imageRef ? (
                      <OradsWizardAtlasImage preview={resolveOradsAtlasPreview(opt.imageRef)} compact />
                    ) : undefined
                  }
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--clinical-border)] bg-[var(--clinical-canvas)]/95 p-3 backdrop-blur-sm">
        <div className="mx-auto grid max-w-lg grid-cols-2 gap-3">
          <Button
            type="button"
            className="rounded-full bg-[var(--clinical-primary)] py-6 text-base font-semibold text-[var(--clinical-primary-foreground)] hover:opacity-95"
            onClick={onOpenTables}
          >
            Таблицы
          </Button>
          <Button
            type="button"
            className="rounded-full bg-[var(--clinical-primary)] py-6 text-base font-semibold text-[var(--clinical-primary-foreground)] hover:opacity-95"
            onClick={onOpenResources}
          >
            Справка
          </Button>
        </div>
      </footer>
    </div>
  );
}
