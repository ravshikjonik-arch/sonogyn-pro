import { assessAneuploidyRisk, type AneuploidyRiskInput } from "./aneuploidyRiskEngine";
import { buildClinicalDecisionSupport } from "./clinicalDecisionSupport";
import { buildDifferentialDiagnosis } from "./differentialEngine";
import { assessFetalDoppler, type DopplerAssessmentInput } from "./dopplerEngine";
import { collectAllTokens } from "./findingSynonyms";
import { assessFetalBiometry, type BiometryStandard } from "./fetalBiometryEngine";
import { generateIsuogReport, type IsuogStructuredReport } from "./isuogReportEngine";
import { assessProtocolCompleteness } from "./protocolAssistant";
import {
  runSonographerCopilot,
  type ReportFormat,
  type ReportInput,
} from "./sonographerAssistant";
import type { BiometricData, DopplerData, GestationalAgeInput } from "./types";
import type {
  DvFlowStatus,
  NasalBoneStatus,
  TricuspidStatus,
} from "./aneuploidyRiskEngine";

export type ObstetricCopilotInput = ReportInput &
  Partial<AneuploidyRiskInput> &
  Partial<DopplerAssessmentInput> & {
    biometryStandard?: BiometryStandard;
    reportFormat?: ReportFormat;
    completedVisualize?: string[];
    completedMeasure?: string[];
    /** Запускать блоки selectively */
    includeAneuploidy?: boolean;
    includeBiometry?: boolean;
    includeDoppler?: boolean;
  };

export type ObstetricCopilotOutput = {
  /** Этап 3 preview */
  sonographer: ReturnType<typeof runSonographerCopilot>;
  /** Этап 4 */
  biometry?: ReturnType<typeof assessFetalBiometry>;
  /** Этап 5 */
  doppler?: ReturnType<typeof assessFetalDoppler>;
  /** Этап 6 */
  aneuploidy?: ReturnType<typeof assessAneuploidyRisk>;
  /** Этап 7 */
  protocol: ReturnType<typeof assessProtocolCompleteness>;
  /** Этап 8 */
  report: IsuogStructuredReport;
  /** Этап 9 */
  clinicalDecision: ReturnType<typeof buildClinicalDecisionSupport>;
  /** Краткая сводка для UI */
  executiveSummaryRu: string;
};

function hasBiometryData(b?: BiometricData): boolean {
  if (!b) return false;
  return [b.bpdMm, b.hcMm, b.acMm, b.flMm, b.hlMm, b.efwGrams, b.lateralVentricleMm].some(
    (x) => x != null && Number.isFinite(x),
  );
}

function hasDopplerInput(input: ObstetricCopilotInput): boolean {
  return (
    input.uaPi != null ||
    input.mcaPi != null ||
    input.dvPi != null ||
    input.utaPi != null ||
    input.dvAWave != null ||
    input.dopplerData != null
  );
}

function shouldRunAneuploidy(input: ObstetricCopilotInput, weeks?: number): boolean {
  if (input.includeAneuploidy === false) return false;
  if (input.maternalAgeYears != null) return true;
  if (input.ntMm != null || input.nasalBone || input.tricuspidRegurgitation || input.dvFlow) return true;
  if (weeks != null && weeks < 14) return input.includeAneuploidy === true;
  return false;
}

/**
 * Этап 10 — полный Obstetric Expert Copilot (Woodward + ISUOG).
 */
export function runObstetricCopilot(input: ObstetricCopilotInput): ObstetricCopilotOutput {
  const tokens = collectAllTokens(input.findings, input.biometricData, input.dopplerData);
  const weeks = input.gestationalAge?.weeks;

  const sonographer = runSonographerCopilot(input);

  let biometry: ObstetricCopilotOutput["biometry"];
  if (input.includeBiometry !== false && hasBiometryData(input.biometricData) && input.gestationalAge?.weeks != null) {
    biometry = assessFetalBiometry({
      gestationalAge: input.gestationalAge,
      standard: input.biometryStandard ?? "intergrowth",
      ...input.biometricData,
    });
  }

  let doppler: ObstetricCopilotOutput["doppler"];
  if (input.includeDoppler !== false && hasDopplerInput(input) && input.gestationalAge?.weeks != null) {
    doppler = assessFetalDoppler({
      gestationalAge: input.gestationalAge,
      dopplerData: input.dopplerData,
      uaPi: input.uaPi,
      mcaPi: input.mcaPi,
      dvPi: input.dvPi,
      utaPi: input.utaPi,
      utaPiLeft: input.utaPiLeft,
      utaPiRight: input.utaPiRight,
      dvAWave: input.dvAWave,
    });
  }

  let aneuploidy: ObstetricCopilotOutput["aneuploidy"];
  if (shouldRunAneuploidy(input, weeks) && input.maternalAgeYears != null) {
    aneuploidy = assessAneuploidyRisk({
      maternalAgeYears: input.maternalAgeYears,
      gestationalAge: input.gestationalAge,
      crlMm: input.crlMm,
      ntMm: input.ntMm,
      nasalBone: input.nasalBone,
      dvFlow: input.dvFlow,
      dvPi: input.dvPi,
      tricuspidRegurgitation: input.tricuspidRegurgitation,
      findings: input.findings,
      biometricData: input.biometricData,
    });
  }

  const protocol = assessProtocolCompleteness({
    gestationalAge: input.gestationalAge,
    findings: input.findings,
    biometricData: input.biometricData,
    dopplerData: input.dopplerData,
    completedVisualize: input.completedVisualize,
    completedMeasure: input.completedMeasure,
  });

  const clinicalDecision = buildClinicalDecisionSupport({
    differential: sonographer.differential,
    biometry,
    doppler,
    aneuploidy,
    tokens,
  });

  const report = generateIsuogReport(
    {
      ...input,
      biometry,
      doppler,
      aneuploidy,
      protocol,
      clinicalDecision,
    },
    input.reportFormat ?? "detailed",
  );

  const topDx = sonographer.differential[0]?.diagnosis;
  const executiveSummaryRu = [
    report.gestationalAgeLabel,
    input.findings.length ? `Находки: ${input.findings.join("; ")}` : "",
    topDx ? `Дифференциал: ${topDx}` : "",
    biometry?.summaryRu,
    doppler?.fgrPattern !== "none" && doppler?.fgrPattern !== "unknown" ? doppler?.summaryRu : "",
    aneuploidy?.riskLevel !== "low" ? aneuploidy?.summaryRu : "",
    `Протокол: ${protocol.completenessScore}%`,
    clinicalDecision.summaryRu,
  ]
    .filter(Boolean)
    .join(". ");

  return {
    sonographer,
    biometry,
    doppler,
    aneuploidy,
    protocol,
    report,
    clinicalDecision,
    executiveSummaryRu,
  };
}

export type {
  GestationalAgeInput,
  BiometricData,
  DopplerData,
  NasalBoneStatus,
  DvFlowStatus,
  TricuspidStatus,
  BiometryStandard,
  ReportFormat,
};
