import type { ImagingQcIssue } from "./image-qc";

export type OradsApplicabilityCode =
  | "ok"
  | "pregnancy_focus"
  | "ectopic_pregnancy"
  | "ovarian_torsion"
  | "non_adnexal_focus"
  | "wrong_modality"
  | "inadequate_study";

export type OradsZeroSuggestion = "not_applicable" | "inadequate";

export type OradsApplicabilityResult = {
  applicable: boolean;
  blockAnalysis: boolean;
  code: OradsApplicabilityCode;
  messageRu: string;
  suggestedOradsZero?: OradsZeroSuggestion;
};

type Input = {
  freeText?: string;
  clinicalContext?: string;
  qcIssues?: ImagingQcIssue[];
};

function corpus(input: Input): string {
  return [input.freeText, input.clinicalContext].filter(Boolean).join("\n").toLowerCase();
}

function matchAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

/**
 * Formal O-RADS US applicability (ACR v2022 scope: adnexal ovarian/extraovarian lesions).
 * Blocks LLM/worker when study context is clearly out of scope or unsafe to auto-hint.
 */
export function evaluateOradsApplicability(input: Input): OradsApplicabilityResult {
  const text = corpus(input);

  const blockedQc = input.qcIssues?.find((i) => i.severity === "block");
  if (blockedQc) {
    return {
      applicable: false,
      blockAnalysis: true,
      code: "inadequate_study",
      messageRu: blockedQc.messageRu,
      suggestedOradsZero: "inadequate",
    };
  }

  if (
    matchAny(text, [
      /маммogra/i,
      /маммограф/,
      /bi-rads/i,
      /birads/,
      /молочн/,
      /breast\s+us/i,
      /ti-rads/,
      /щитовид/,
      /thyroid/i,
    ])
  ) {
    return {
      applicable: false,
      blockAnalysis: true,
      code: "wrong_modality",
      messageRu:
        "Снимок или контекст относятся к другой модальности (МЖ, щитовидная и т.д.). O-RADS US для придатков здесь не применяется — используйте соответствующий калькулятор.",
      suggestedOradsZero: "not_applicable",
    };
  }

  if (matchAny(text, [/внематочн/, /ectopic/, /эктопическ/])) {
    return {
      applicable: false,
      blockAnalysis: true,
      code: "ectopic_pregnancy",
      messageRu:
        "При подозрении на внематочную беременность O-RADS US для яичникового образования не применяется. Срочная клиническая тактика — по протоколу центра.",
      suggestedOradsZero: "not_applicable",
    };
  }

  if (matchAny(text, [/перекрут\s*яичник/, /ovarian\s*torsion/, /torsion/])) {
    return {
      applicable: false,
      blockAnalysis: true,
      code: "ovarian_torsion",
      messageRu:
        "При перекруте яичника приоритет — не O-RADS-стадирование, а неотложная помощь. Категория O-RADS US не рассчитывается автоматически.",
      suggestedOradsZero: "not_applicable",
    };
  }

  if (
    matchAny(text, [
      /\bберемен/i,
      /pregnancy/,
      /плод\s*в\s*матке/,
      /внутриматочн/,
      /gestational\s*age/,
      /срок\s*беремен/,
      /плацент/,
      /placenta/,
    ]) &&
    !matchAny(text, [/яичник/, /ovary/, /ovarian/, /придаток/, /adnex/])
  ) {
    return {
      applicable: false,
      blockAnalysis: true,
      code: "pregnancy_focus",
      messageRu:
        "Контекст — беременность/плод без описания отдельного яичникового образования. O-RADS US v2022 для акушерского скрининга не заменяет obstetric-протокол.",
      suggestedOradsZero: "not_applicable",
    };
  }

  if (
    matchAny(text, [
      /только\s*матк/,
      /фокус\s*на\s*матке/,
      /миома\s*матки\s*без\s*яичник/,
      /endometri(?:um|osis)\s*only/i,
    ])
  ) {
    return {
      applicable: false,
      blockAnalysis: false,
      code: "non_adnexal_focus",
      messageRu:
        "Описание сфокусировано на матке/эндометрии. O-RADS US применяют к образованию яичника или экстраовариальной локализации — уточните придатки.",
      suggestedOradsZero: "not_applicable",
    };
  }

  return {
    applicable: true,
    blockAnalysis: false,
    code: "ok",
    messageRu: "Контекст подходит для assistive-разбора O-RADS US (подтверждение врачом обязательно).",
  };
}
