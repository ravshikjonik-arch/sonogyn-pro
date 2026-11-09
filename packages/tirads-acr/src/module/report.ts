import {
  COMPOSITION_OPTIONS,
  ECHOGENIC_FOCI_OPTIONS,
  ECHOGENICITY_OPTIONS,
  MARGIN_OPTIONS,
  SHAPE_OPTIONS,
  type LexiconOption,
} from "../lexicon";
import {
  EU_COMPOSITION_OPTIONS,
  EU_ECHOGENICITY_OPTIONS,
  EU_ETE_OPTIONS,
  EU_MARGINS_OPTIONS,
  EU_MICROCALCIFICATIONS_OPTIONS,
  EU_SHAPE_OPTIONS,
  type EuOption,
} from "../eu";
import type {
  ThyroidNodule,
  ThyroidNoduleEvaluation,
  ThyroidNoduleLocation,
  ThyroidReport,
  ThyroidReportSystem,
  ThyroidStudyEvaluation,
  ThyroidStudyInput,
} from "./types";

export const THYROID_REPORT_DISCLAIMER_RU =
  "Справочно. Не является диагнозом. Интерпретация и тактика — лечащий врач.";

const LOCATION_IN_RU: Record<ThyroidNoduleLocation, string> = {
  right_lobe: "В правой доле",
  left_lobe: "В левой доле",
  isthmus: "В перешейке",
};
const LOCATION_OF_RU: Record<ThyroidNoduleLocation, string> = {
  right_lobe: "правой доли",
  left_lobe: "левой доли",
  isthmus: "перешейка",
};
const LYMPH_RU = {
  not_assessed: "не оценивались",
  normal: "без особенностей",
  indeterminate: "с неопределёнными признаками",
  suspicious: "с подозрительными признаками",
} as const;
const EU_PROFILE_RU = { RU_KR_2024: "КР 2024", ETA_2023: "ETA 2023" } as const;
const FNA_RU = {
  indicated: "ТАБ показана",
  consider: "ТАБ рассмотреть",
  not_indicated: "ТАБ не показана",
  undetermined: "показания к ТАБ не определены",
} as const;

function num(v: number): string {
  return String(Math.round(v * 10) / 10).replace(".", ",");
}

function label<T extends string>(options: (EuOption<T> | LexiconOption<T>)[], value: T | undefined): string | null {
  if (value === undefined) return null;
  const raw = options.find((o) => o.value === value)?.labelRu;
  return raw ? raw.replace(/\s*\([^)]*\)/g, "").trim() : null;
}

const ACR_FOCI_REPORT_RU: Record<string, string> = {
  none_or_comet_tail: "отсутствуют или крупные артефакты «хвост кометы»",
  macrocalcifications: "макрокальцинаты",
  peripheral_rim: "периферические (ободковые) кальцинаты",
  punctate: "точечные эхогенные включения",
};

function pointsRu(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} балл`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} балла`;
  return `${n} баллов`;
}

function dimensionsText(n: ThyroidNodule): string {
  const d = n.dimensionsMm ?? {};
  const { longitudinal: l, anteroposterior: ap, transverse: t } = d;
  if (l !== undefined && ap !== undefined && t !== undefined) {
    return `размерами ${num(l)} × ${num(ap)} × ${num(t)} мм (продольный × переднезадний × поперечный)`;
  }
  const parts = [
    l !== undefined ? `продольный ${num(l)} мм` : null,
    ap !== undefined ? `переднезадний ${num(ap)} мм` : null,
    t !== undefined ? `поперечный ${num(t)} мм` : null,
  ].filter(Boolean);
  return parts.length ? `размеры: ${parts.join(", ")}` : "размеры не указаны";
}

function line(name: string, value: string | null, required: boolean): string | null {
  if (value) return `${name}: ${value.toLowerCase()}.`;
  return required ? `${name}: не оценено.` : null;
}

function euFeatureLines(n: ThyroidNodule): string[] {
  const eu = n.eu ?? {};
  const solid = eu.composition === "mixed" || eu.composition === "solid";
  const ete = eu.extrathyroidalExtension && eu.extrathyroidalExtension !== "none" ? label(EU_ETE_OPTIONS, eu.extrathyroidalExtension) : null;
  return [
    line("Структура", label(EU_COMPOSITION_OPTIONS, eu.composition), true),
    line("Эхогенность", label(EU_ECHOGENICITY_OPTIONS, eu.echogenicity), solid),
    line("Форма", label(EU_SHAPE_OPTIONS, eu.shape), solid),
    line("Контуры", label(EU_MARGINS_OPTIONS, eu.margins), solid),
    line("Микрокальцинаты", eu.microcalcifications ? (eu.microcalcifications === "present" ? "есть" : "нет") : null, solid),
    ete ? `${ete}.` : null,
  ].filter((s): s is string => Boolean(s));
}

function acrFeatureLines(n: ThyroidNodule): string[] {
  const acr = n.acr ?? {};
  const full = acr.composition !== undefined && acr.composition !== "spongiform" && acr.composition !== "no_nodule";
  const foci = acr.echogenicFoci?.length
    ? acr.echogenicFoci.map((f) => ACR_FOCI_REPORT_RU[f] ?? label(ECHOGENIC_FOCI_OPTIONS, f)).filter(Boolean).join(", ")
    : null;
  return [
    line("Структура", label(COMPOSITION_OPTIONS, acr.composition), true),
    line("Эхогенность", label(ECHOGENICITY_OPTIONS, acr.echogenicity), full),
    line("Форма", label(SHAPE_OPTIONS, acr.shape), full),
    line("Контуры", label(MARGIN_OPTIONS, acr.margin), full),
    line("Эхогенные включения", foci, full),
  ].filter((s): s is string => Boolean(s));
}

function isNoNodule(n: ThyroidNodule): boolean {
  return n.eu?.composition === "no_nodule" || n.acr?.composition === "no_nodule";
}

function euConclusion(row: ThyroidNoduleEvaluation): string | null {
  if (!row.eu) return null;
  if (row.eu.status === "ok") return row.eu.categoryLabelRu.split(" · ")[0];
  if (row.eu.status === "incomplete") return "EU-TIRADS: категория не определена — не хватает данных";
  return "EU-TIRADS: ошибка ввода";
}

function acrConclusion(row: ThyroidNoduleEvaluation): string | null {
  if (!row.acr) return null;
  if (row.acr.status === "ok") return `ACR TI-RADS ${row.acr.result.category} (${pointsRu(row.acr.result.totalPoints)})`;
  if (row.acr.status === "incomplete") return "ACR TI-RADS: категория не определена — не хватает данных";
  return "ACR TI-RADS: ошибка ввода";
}

/** Text built only from entered findings; anything not entered is marked «не оценено», never invented. */
export function generateThyroidReport(
  study: ThyroidStudyInput,
  evaluation: ThyroidStudyEvaluation,
  system: ThyroidReportSystem,
): ThyroidReport {
  const useEu = system !== "acr";
  const useAcr = system !== "eu";
  const description: string[] = ["Щитовидная железа:"];
  const conclusion: string[] = [];
  const tactics: string[] = [];
  const warnings = new Set<string>();
  const sources = new Set<string>();

  const realNodules = study.nodules.filter((n) => !isNoNodule(n));
  if (realNodules.length === 0) {
    description.push("Узловые образования не выявлены.");
    conclusion.push(useEu ? "Узловые образования щитовидной железы не выявлены (EU-TIRADS 1)." : "Узловые образования щитовидной железы не выявлены (ACR TI-RADS TR1).");
  }

  realNodules.forEach((n, index) => {
    const row = evaluation.nodules.find((r) => r.noduleId === n.id);
    const title = realNodules.length > 1 ? `Узел ${index + 1}. ` : "";
    const where = n.location ? LOCATION_IN_RU[n.location] : "Локализация не указана;";
    description.push(`${title}${where} определяется узловое образование, ${dimensionsText(n)}.`);
    const featureLines = useEu && n.eu ? euFeatureLines(n) : useAcr && n.acr ? acrFeatureLines(n) : [];
    description.push(...featureLines);
    if (useEu && useAcr && n.eu && n.acr) {
      const acrText = acrFeatureLines(n)
        .map((s) => s.replace(/\.$/, "").replace(/^([^:]+):/, (_, k: string) => `${k.toLowerCase()} —`))
        .join("; ");
      description.push(`По лексикону ACR TI-RADS: ${acrText}.`);
    }
    if (!row) return;

    const of = n.location ? ` ${LOCATION_OF_RU[n.location]}` : "";
    const cats = [useEu ? euConclusion(row) : null, useAcr ? acrConclusion(row) : null].filter(Boolean);
    conclusion.push(`${title}УЗ-признаки узлового образования${of} щитовидной железы.${cats.length ? ` ${cats.join("; ")}.` : ""}`);

    if (useEu && row.eu?.status === "ok") {
      const m = row.eu.management;
      tactics.push(
        `${title}EU-TIRADS (${EU_PROFILE_RU[m.profile]}): ${FNA_RU[m.fna]}. ${m.fnaReasonRu}${m.followUpRu ? ` ${m.followUpRu}` : ""}`,
      );
      sources.add(m.source.citation);
      sources.add(row.eu.classificationSource.citation);
      row.eu.warnings.forEach((w) => warnings.add(w.messageRu));
    }
    if (useAcr && row.acr?.status === "ok") {
      const m = row.acr.management;
      tactics.push(`${title}ACR TI-RADS: ${FNA_RU[m.fna]}. ${m.fnaReasonRu}${m.followUpRu ? ` ${m.followUpRu}` : ""}`);
      sources.add(row.acr.source.citation);
      row.acr.warnings.forEach((w) => warnings.add(w.messageRu));
    }
  });

  description.push(`Регионарные лимфоузлы: ${LYMPH_RU[study.lymphNodes ?? "not_assessed"]}.`);

  if (realNodules.length > 1) {
    const highestId = useEu ? evaluation.highestEu : evaluation.highestAcr;
    const idx = realNodules.findIndex((n) => n.id === highestId);
    if (idx >= 0) conclusion.push(`Наибольшая категория риска — узел ${idx + 1}.`);
  }

  return {
    descriptionRu: description.join("\n"),
    conclusionRu: conclusion.join("\n"),
    tacticsRu: tactics.join("\n"),
    warningsRu: [...warnings],
    sourcesRu: [...sources],
    disclaimerRu: THYROID_REPORT_DISCLAIMER_RU,
  };
}
