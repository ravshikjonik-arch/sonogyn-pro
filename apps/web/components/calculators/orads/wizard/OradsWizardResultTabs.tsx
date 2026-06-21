"use client";

import type { AdnexTriangulation } from "@repo/adnex-education";
import type { OradsTreePathStep, OradsTreeResult } from "@repo/orads-us";
import { useMemo, useState } from "react";

import { AdnexConsensusPanel } from "@/components/calculators/orads/AdnexConsensusPanel";
import { OradsWizardResultPanel } from "@/components/calculators/orads/wizard/OradsWizardResultPanel";
import { IotaSimpleRulesPanel } from "@/components/calculators/orads/IotaSimpleRulesPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { OradsLocaleWeb } from "@/lib/orads-us/useOradsLocaleWeb";
import { evaluateWizardTriangulation } from "@/lib/reports/sre-classification";

type Props = {
  path: OradsTreePathStep[];
  result: OradsTreeResult;
  pathSummary: string[];
  locale: OradsLocaleWeb;
  onRestart: () => void;
  onBack: () => void;
  onBuildReport: (triangulation: AdnexTriangulation) => void;
  onAskAscites?: () => void;
};

export function OradsWizardResultTabs({
  path,
  result,
  pathSummary,
  locale,
  onRestart,
  onBack,
  onBuildReport,
  onAskAscites,
}: Props) {
  const [tab, setTab] = useState("summary");

  const triangulation = useMemo(
    () => evaluateWizardTriangulation(path, result.categoryNumber),
    [path, result.categoryNumber],
  );

  return (
    <Tabs value={tab} onValueChange={setTab} className="space-y-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="summary">Итог O-RADS</TabsTrigger>
        <TabsTrigger value="iota">IOTA × O-RADS</TabsTrigger>
      </TabsList>

      <TabsContent value="summary" className="mt-0 space-y-4">
        <OradsWizardResultPanel
          result={result}
          locale={locale}
          pathSummary={pathSummary}
          onRestart={onRestart}
          onBack={onBack}
          onBuildReport={() => onBuildReport(triangulation)}
          onAskAscites={onAskAscites}
        />
      </TabsContent>

      <TabsContent value="iota" className="mt-0 space-y-4">
        <AdnexConsensusPanel triangulation={triangulation} />
        <details className="rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-3">
          <summary className="cursor-pointer text-sm font-bold text-[var(--clinical-foreground)]">
            IOTA Simple Rules — ручная проверка B/M
          </summary>
          <div className="mt-3">
            <IotaSimpleRulesPanel />
          </div>
        </details>
        <button
          type="button"
          className="w-full rounded-xl bg-[var(--clinical-primary)] px-4 py-3 text-sm font-bold text-white hover:bg-[var(--clinical-primary-hover)]"
          onClick={() => onBuildReport(triangulation)}
        >
          Структурированный протокол (с IOTA)
        </button>
      </TabsContent>
    </Tabs>
  );
}
