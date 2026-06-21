"use client";

import type { OradsTreeResult } from "@repo/orads-us";
import Link from "next/link";
import { toast } from "sonner";

import {
  oradsColorClasses,
  oradsTextColorClasses,
} from "@/components/calculators/orads/wizard/OradsWizardUi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OradsLocaleWeb } from "@/lib/orads-us/useOradsLocaleWeb";
import { cn } from "@/lib/utils/cn";

type Props = {
  result: OradsTreeResult;
  locale: OradsLocaleWeb;
  pathSummary: string[];
  onRestart: () => void;
  onBack: () => void;
  onBuildReport?: () => void;
  onAskAscites?: () => void;
};

export function OradsWizardResultPanel({
  result,
  locale,
  pathSummary,
  onRestart,
  onBack,
  onBuildReport,
  onAskAscites,
}: Props) {
  const management = locale.t(result.managementKey);
  const rationale = result.rationaleKey ? locale.t(result.rationaleKey) : "";

  function copyReport() {
    const lines = [
      result.category,
      `${locale.t("orads.wizard.rom_label")}: ${result.riskPercent}`,
      ...pathSummary,
      rationale,
      management,
      locale.t("orads.meta.disclaimer"),
    ].filter(Boolean);
    void navigator.clipboard.writeText(lines.join("\n")).then(() => toast.success("Скопировано"));
  }

  return (
    <Card className={cn("border-2 shadow-md", oradsColorClasses(result.colorCode))}>
      <CardHeader className="pb-2">
        <CardTitle className={cn("text-3xl font-black", oradsTextColorClasses(result.colorCode))}>
          {result.category}
        </CardTitle>
        <p className={cn("text-base font-bold", oradsTextColorClasses(result.colorCode))}>
          {locale.t("orads.wizard.rom_label")}: {result.riskPercent}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {rationale ? <p className="text-[var(--clinical-foreground-muted)]">• {rationale}</p> : null}
        <p className="font-medium leading-relaxed">{management}</p>

        {pathSummary.length > 0 ? (
          <div className="rounded-lg bg-white/70 p-3">
            <p className="text-xs font-bold text-[var(--clinical-foreground)]">
              {locale.t("orads.wizard.path_summary")}
            </p>
            <ul className="mt-1 space-y-0.5 text-xs text-[var(--clinical-foreground-muted)]">
              {pathSummary.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="text-xs text-[var(--clinical-foreground-muted)]">{locale.t("orads.meta.disclaimer")}</p>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={onBack}>
            {locale.t("orads.wizard.back")}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={copyReport}>
            {locale.t("orads.wizard.copy")}
          </Button>
          {onBuildReport ? (
            <Button type="button" size="sm" onClick={onBuildReport}>
              Структурированный протокол
            </Button>
          ) : null}
          <Button type="button" variant="secondary" size="sm" asChild>
            <Link href="/library/orads-guide">Руководство O-RADS</Link>
          </Button>
          {onAskAscites ? (
            <Button type="button" variant="destructive" size="sm" onClick={onAskAscites}>
              {locale.t("orads.modifier.ascites.question")}
            </Button>
          ) : null}
          <Button type="button" variant="ghost" size="sm" onClick={onRestart}>
            {locale.t("orads.wizard.restart")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
