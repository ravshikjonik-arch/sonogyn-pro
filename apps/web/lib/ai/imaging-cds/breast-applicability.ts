import type { ImagingQcIssue } from "./image-qc";

export type BreastApplicabilityCode =
  | "ok"
  | "wrong_modality"
  | "inadequate_study"
  | "pregnancy_obstetric_only";

export type BreastApplicabilityResult = {
  applicable: boolean;
  blockAnalysis: boolean;
  code: BreastApplicabilityCode;
  messageRu: string;
};

type Input = {
  freeText?: string;
  clinicalContext?: string;
  qcIssues?: ImagingQcIssue[];
};

function corpus(input: Input): string {
  return [input.freeText, input.clinicalContext].filter(Boolean).join("\n").toLowerCase();
}

export function evaluateBreastApplicability(input: Input): BreastApplicabilityResult {
  const blockedQc = input.qcIssues?.find((i) => i.severity === "block");
  if (blockedQc) {
    return {
      applicable: false,
      blockAnalysis: true,
      code: "inadequate_study",
      messageRu: blockedQc.messageRu,
    };
  }

  const text = corpus(input);
  if (/o-rads|orads|яичник|придаток|adnex|щитовид|ti-rads|thyroid/i.test(text)) {
    return {
      applicable: false,
      blockAnalysis: true,
      code: "wrong_modality",
      messageRu:
        "Контекст относится не к УЗИ молочной железы. Используйте O-RADS / TI-RADS или калькулятор придатков.",
    };
  }

  if (/скрининг\s*1\s*триместр|крупная\s*анатомия\s*плода|фетометри/i.test(text) && !/молоч|breast|birads/i.test(text)) {
    return {
      applicable: false,
      blockAnalysis: true,
      code: "pregnancy_obstetric_only",
      messageRu: "Контекст акушерского скрининга без описания МЖ. BI-RADS US здесь не применяется.",
    };
  }

  return {
    applicable: true,
    blockAnalysis: false,
    code: "ok",
    messageRu: "Контекст подходит для assistive BI-RADS US (категорию подтверждает врач).",
  };
}
