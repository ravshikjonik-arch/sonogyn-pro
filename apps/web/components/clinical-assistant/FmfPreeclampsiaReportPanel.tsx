"use client";

import type { FirstTrimesterScreeningOutput } from "@repo/fmf";
import { useMemo } from "react";

import { CalculatorReportPanel } from "@/components/calculators/CalculatorReportPanel";
import { buildCalculatorGeneratedReport } from "@/lib/reports/calculator-report-bridge";
import { deriveFmfPeRiskLabels } from "@/lib/reports/fmf-pe-risk-label";
import type { FirstTrimesterInput } from "../../../mobile/src/features/fmf/types";

type Props = {
  first: FirstTrimesterInput;
  screening: FirstTrimesterScreeningOutput;
  gaWeeks?: number;
};

export function FmfPreeclampsiaReportPanel({ first, screening, gaWeeks }: Props) {
  const reportText = useMemo(() => {
    const { earlyPeRisk, termPeRisk } = deriveFmfPeRiskLabels(screening.measurements);
    const generated = buildCalculatorGeneratedReport(
      "fmf-preeclampsia",
      {
        gaWeeks,
        sbp: first.sbpMmHg,
        dbp: first.dbpMmHg,
        mapMmHg: screening.mapMmHg,
        utaPi: screening.uterinePiMean,
      },
      { earlyPeRisk, termPeRisk, mapMmHg: screening.mapMmHg },
      gaWeeks != null ? String(gaWeeks) : undefined,
    );
    return generated?.plainText ?? null;
  }, [first.dbpMmHg, first.sbpMmHg, gaWeeks, screening.mapMmHg, screening.measurements, screening.uterinePiMean]);

  if (!reportText) return null;

  const hasPeInputs =
    (first.sbpMmHg != null && first.dbpMmHg != null) ||
    (first.uterinePiLeft != null && first.uterinePiRight != null);
  if (!hasPeInputs) return null;

  return (
    <CalculatorReportPanel
      title="FMF · риск преэклампии — черновик"
      reportText={reportText}
      filenameBase="fmf-preeclampsia-screening"
      sharePath="/ai/consultants/fmf"
      shareParams={{
        section: "first",
        sbp: first.sbpMmHg ?? null,
        dbp: first.dbpMmHg ?? null,
        utaPi: screening.uterinePiMean ?? null,
      }}
      repeatHref="/ai/consultants/fmf?section=first"
    />
  );
}
