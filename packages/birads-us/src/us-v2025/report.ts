import {
  BIRADS_ASSOCIATED_OPTIONS,
  BIRADS_CALC_OPTIONS,
  BIRADS_ECHO_OPTIONS,
  BIRADS_MARGIN_OPTIONS,
  BIRADS_NML_DISTRIBUTION_OPTIONS,
  BIRADS_NML_ECHO_OPTIONS,
  BIRADS_ORIENTATION_OPTIONS,
  BIRADS_POSTERIOR_OPTIONS,
  BIRADS_SHAPE_OPTIONS,
  BIRADS_SPECIAL_CASE_OPTIONS,
  BIRADS_US_SOURCES,
  BIRADS_VASCULARITY_OPTIONS,
  type BiradsOption,
} from "./lexicon";
import { formatBreastMm, formatLesionDimensionsRu, missingLesionDimensionsRu } from "./study";
import type { BreastLesion, BreastLymphStation, BreastSide, BreastStudyEvaluation, BreastStudyInput } from "./study";

export type BreastReport = {
  descriptionRu: string;
  conclusionRu: string;
  recommendationsRu: string;
  warningsRu: string[];
  sourcesRu: string[];
  disclaimerRu: string;
};

export const BREAST_REPORT_DISCLAIMER_RU = "Справочно. Не является диагнозом. Интерпретация и тактика — лечащий врач.";

const SIDE_RU: Record<BreastSide, string> = { right: "Правая молочная железа", left: "Левая молочная железа" };
const DEPTH_RU = { anterior: "передняя треть", middle: "средняя треть", posterior: "задняя треть" } as const;
const STATION_RU: Record<BreastLymphStation, string> = {
  intramammary: "интрамаммарный",
  axillary_I: "подмышечный, уровень I",
  axillary_II: "подмышечный, уровень II",
  axillary_III: "подмышечный, уровень III",
  internal_mammary: "внутренний грудной",
  supraclavicular: "надключичный",
};
const LN_ASSESSMENT_RU = { normal: "без особенностей", indeterminate: "неопределённые признаки", suspicious: "подозрительные признаки" } as const;


function label<T extends string>(options: BiradsOption<T>[], value: T | undefined): string | null {
  if (value === undefined) return null;
  const raw = options.find((o) => o.value === value)?.labelRu;
  return raw ? raw.replace(/\s*\([^)]*\)/g, "").trim().toLowerCase() : null;
}

function line(name: string, value: string | null): string {
  return `${name}: ${value ?? "не описано"}.`;
}

function locationText(l: BreastLesion): string {
  const parts = [
    l.clock !== undefined ? `на ${l.clock} ч` : null,
    l.distanceFromNippleMm !== undefined ? `${formatBreastMm(l.distanceFromNippleMm)} мм от соска` : null,
    l.depth ? DEPTH_RU[l.depth] : null,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "локализация не указана";
}

function dimsText(l: BreastLesion): string {
  const full = formatLesionDimensionsRu(l);
  if (full) return `размерами ${full} (ширина × переднезадний × длина)`;
  return `размеры не указаны полностью (нет: ${missingLesionDimensionsRu(l).join(", ")})`;
}

function findingLines(l: BreastLesion): string[] {
  const f = l.findings;
  const assoc = !f.associated?.length
    ? null
    : f.associated.includes("none")
      ? "нет"
      : f.associated.map((a) => label(BIRADS_ASSOCIATED_OPTIONS, a)).filter(Boolean).join(", ");
  const calc = f.calcifications === "none" ? "нет" : label(BIRADS_CALC_OPTIONS, f.calcifications);
  const VASC_RU = { avascular: "не определяется", internal: "внутренний", peripheral: "периферический" } as const;
  const tail = [line("Кальцинаты", calc), line("Сопутствующие признаки", assoc)];
  if (f.vascularity) tail.push(line("Кровоток при ЦДК", VASC_RU[f.vascularity] ?? label(BIRADS_VASCULARITY_OPTIONS, f.vascularity)));
  if (f.kind === "special_case") return [line("Особый случай", label(BIRADS_SPECIAL_CASE_OPTIONS, f.specialCase))];
  if (f.kind === "non_mass") {
    return [
      "Non-mass изменение.",
      line("Распределение", label(BIRADS_NML_DISTRIBUTION_OPTIONS, f.nmlDistribution)),
      line("Эхогенность", label(BIRADS_NML_ECHO_OPTIONS, f.nmlEcho)),
      line("Задние признаки", label(BIRADS_POSTERIOR_OPTIONS, f.nmlPosterior)),
      ...tail,
    ];
  }
  return [
    line("Форма", label(BIRADS_SHAPE_OPTIONS, f.shape)),
    line("Ориентация", label(BIRADS_ORIENTATION_OPTIONS, f.orientation)),
    line("Контур", label(BIRADS_MARGIN_OPTIONS, f.margin)),
    line("Эхоструктура", label(BIRADS_ECHO_OPTIONS, f.echoPattern)),
    line("Задние акустические признаки", label(BIRADS_POSTERIOR_OPTIONS, f.posterior)),
    ...tail,
  ];
}

/** Text built only from entered findings; anything not entered is marked «не описано», never invented. */
export function generateBreastReport(study: BreastStudyInput, evaluation: BreastStudyEvaluation): BreastReport {
  const description: string[] = [];
  const conclusion: string[] = [];
  const recommendations: string[] = [];
  const warnings = new Set<string>(evaluation.warningsRu);
  const numberOf = new Map(study.lesions.map((l, i) => [l.id, i + 1]));

  for (const side of ["right", "left"] as const) {
    if (!study.sidesExamined.includes(side)) continue;
    const own = study.lesions.filter((l) => l.side === side);
    description.push(`${SIDE_RU[side]}:`);
    if (own.length === 0) description.push("Очаговых образований не выявлено.");
    for (const l of own) {
      const kind = l.findings.kind === "non_mass" ? "Участок" : "Образование";
      description.push(`${kind} ${numberOf.get(l.id)}: ${locationText(l)}, ${dimsText(l)}.`);
      description.push(...findingLines(l));
      const ev = evaluation.lesions.find((e) => e.lesionId === l.id);
      if (ev?.result.status === "ok") ev.result.notesRu.forEach((n) => warnings.add(`Образование ${numberOf.get(l.id)}: ${n}`));
    }
    const ln = (study.lymphNodes ?? []).filter((n) => n.side === side);
    for (const n of ln) description.push(`Лимфоузел ${STATION_RU[n.station]}: ${LN_ASSESSMENT_RU[n.assessment]}.`);

    const sa = evaluation.sides.find((s) => s.side === side);
    if (sa?.status === "final") {
      const from = sa.fromLesionId ? ` (по образованию ${numberOf.get(sa.fromLesionId)})` : "";
      conclusion.push(`${SIDE_RU[side]}: ${sa.info.labelRu}${from}. Вероятность злокачественности: ${sa.info.likelihoodRu}.`);
      recommendations.push(`${SIDE_RU[side]}: ${sa.info.managementRu}`);
    } else if (sa?.status === "pending") {
      const list = sa.lesionIds.map((id) => numberOf.get(id)).join(", ");
      conclusion.push(`${SIDE_RU[side]}: категория не определена — выберите категорию для образования ${list}.`);
    }
  }

  return {
    descriptionRu: description.join("\n"),
    conclusionRu: conclusion.join("\n"),
    recommendationsRu: recommendations.join("\n"),
    warningsRu: [...warnings],
    sourcesRu: [BIRADS_US_SOURCES.ACR_BIRADS_V2025.citation, BIRADS_US_SOURCES.ACR_BIRADS_US_2013.citation],
    disclaimerRu: BREAST_REPORT_DISCLAIMER_RU,
  };
}
