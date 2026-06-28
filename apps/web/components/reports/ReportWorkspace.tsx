"use client";

import type { AdnexStructuredReportInput } from "@repo/types";
import { ADNEX_ORADS_V1_TEMPLATE_SLUG } from "@repo/report-engine";
import Link from "next/link";
import { useEffect, useState } from "react";

import { StructuredReportWorkspace } from "@/components/reports/StructuredReportWorkspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mapOradsToAdnexSreInput } from "@/lib/reports/map-orads-to-sre-input";
import { mapOradsTreeToSreInput } from "@/lib/reports/map-orads-tree-to-sre-input";
import { clearOradsBridgePayload, loadOradsBridgePayload } from "@/lib/reports/sre-orads-bridge";
import {
  clearOradsWizardBridgePayload,
  loadOradsWizardBridgePayload,
} from "@/lib/reports/sre-orads-wizard-bridge";

type Props = {
  initialInput?: AdnexStructuredReportInput;
  className?: string;
};

export function ReportWorkspace({ initialInput, className }: Props) {
  const [sreInput, setSreInput] = useState<AdnexStructuredReportInput | null>(initialInput ?? null);

  useEffect(() => {
    if (initialInput) return;
    const wizardBridge = loadOradsWizardBridgePayload();
    if (wizardBridge) {
      setSreInput(
        mapOradsTreeToSreInput(
          wizardBridge.path,
          wizardBridge.result,
          wizardBridge.pathSummary,
          wizardBridge.triangulation,
        ),
      );
      clearOradsWizardBridgePayload();
      return;
    }
    const bridge = loadOradsBridgePayload();
    if (!bridge) return;
    setSreInput(mapOradsToAdnexSreInput(bridge.input, bridge.result, undefined, bridge.triangulation));
    clearOradsBridgePayload();
  }, [initialInput]);

  const cat = sreInput?.classification.oradsCategory;

  return (
    <StructuredReportWorkspace
      className={className}
      templateSlug={ADNEX_ORADS_V1_TEMPLATE_SLUG}
      title="Протокол · придатки O-RADS"
      description="Три блока — описание, заключение, рекомендации. Редактируйте перед сохранением. Не диагноз; интерпретация — лечащий специалист."
      input={sreInput}
      backHref="/tools/calc/rads/o-rads"
      backLabel="← O-RADS Pro"
      exportFilenameBase={`sre-adnex${cat != null ? `-orads-${cat}` : ""}`}
      exportTitle="Структурированный протокол · придатки O-RADS"
      exportMeta={cat != null ? [{ label: "O-RADS US", value: String(cat) }] : undefined}
      inputMissingMessage="Нет данных для генерации. Заполните O-RADS Pro или передайте input."
      emptyState={
        <Card className="border-dashed border-[var(--clinical-border)]">
          <CardHeader>
            <CardTitle className="text-base">Нет входных данных</CardTitle>
            <CardDescription>
              Заполните калькулятор O-RADS Pro и нажмите «Структурированный протокол», либо откройте эту страницу после
              расчёта.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/tools/calc/rads/o-rads">Перейти к O-RADS Pro</Link>
            </Button>
          </CardContent>
        </Card>
      }
    />
  );
}
