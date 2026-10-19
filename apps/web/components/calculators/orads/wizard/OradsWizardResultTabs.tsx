"use client";

import type { AdnexTriangulation } from "@repo/adnex-education";
import { mapOradsTreeToSreInput } from "@repo/report-engine";
import type { OradsTreePathStep, OradsTreeResult } from "@repo/orads-us";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { AdnexConsensusPanel } from "@/components/calculators/orads/AdnexConsensusPanel";
import { OradsWizardResultPanel } from "@/components/calculators/orads/wizard/OradsWizardResultPanel";
import { IotaSimpleRulesPanel } from "@/components/calculators/orads/IotaSimpleRulesPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { OradsLocaleWeb } from "@/lib/orads-us/useOradsLocaleWeb";
import { mapSreToAdnexInput } from "@/lib/iota/map-sre-to-adnex-input";
import { saveIotaBridgePayload } from "@/lib/reports/sre-iota-bridge";
import { evaluateWizardTriangulation } from "@/lib/reports/sre-classification";
import { Button } from "@/components/ui/button";

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
  const router = useRouter();
  const [tab, setTab] = useState("summary");

  const triangulation = useMemo(
    () => evaluateWizardTriangulation(path, result.categoryNumber),
    [path, result.categoryNumber],
  );

  function openIotaAdnex() {
    const sre = mapOradsTreeToSreInput(path, result, pathSummary, triangulation);
    saveIotaBridgePayload({
      adnex: mapSreToAdnexInput(sre),
      oradsCategory: result.categoryNumber,
    });
    router.push("/tools/calc/rads/iota");
  }

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
        <Button type="button" className="w-full" onClick={() => onBuildReport(triangulation)}>
          Структурированный протокол (с IOTA)
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={openIotaAdnex}>
          ADNEX / LR2 (вероятности IOTA)
        </Button>
      </TabsContent>
    </Tabs>
  );
}
