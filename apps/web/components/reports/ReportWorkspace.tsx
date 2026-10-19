"use client";

import type { AdnexStructuredReportInput } from "@repo/types";
import { ADNEX_ORADS_V1_TEMPLATE_SLUG } from "@repo/report-engine";
import Link from "next/link";
import { useEffect, useState } from "react";

import { StructuredReportWorkspace } from "@/components/reports/StructuredReportWorkspace";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mapSreToAdnexInput } from "@/lib/iota/map-sre-to-adnex-input";
import { mapOradsToAdnexSreInput } from "@/lib/reports/map-orads-to-sre-input";
import { saveIotaBridgePayload } from "@/lib/reports/sre-iota-bridge";
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
      inputMissingMessage="Нет данных для генерации. Пройдите мастер O-RADS US или O-RADS Pro."
      formPanel={
        sreInput ? (
          <Card className="border-[var(--clinical-border)] bg-[var(--clinical-surface)]/40">
            <CardContent className="flex flex-wrap items-center gap-2 pt-6">
              <p className="text-sm text-[var(--clinical-foreground-muted)]">
                Вероятностные модели IOTA (ADNEX, LR2, Simple Rules Risk) с сопоставлением O-RADS US.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link
                  href="/tools/calc/rads/iota"
                  onClick={() => {
                    saveIotaBridgePayload({
                      adnex: mapSreToAdnexInput(sreInput),
                      oradsCategory: sreInput.classification.oradsCategory ?? null,
                    });
                  }}
                >
                  Калькулятор IOTA / ADNEX
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null
      }
      emptyState={
        <Card className="border-dashed border-[var(--clinical-border)]">
          <CardHeader>
            <CardTitle className="text-base">Нет входных данных</CardTitle>
            <CardDescription>
              Откройте мастер O-RADS US (дерево) или O-RADS Pro и нажмите «Структурированный протокол» — данные
              подставятся автоматически.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/tools/calc/rads/o-rads">Мастер O-RADS US</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/tools/calc/rads/o-rads">O-RADS Pro</Link>
            </Button>
          </CardContent>
        </Card>
      }
    />
  );
}
