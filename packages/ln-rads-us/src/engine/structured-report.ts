import { LN_RADS_VERSION } from "../knowledge/categories";
import { enrichEngineResult } from "./enrich-result";
import type { LnRadsInput, LnReportLevel, LnReportTemplate } from "../types";

export type StructuredLnReport = {
  template: LnReportTemplate;
  level: LnReportLevel;
  title: string;
  sections: { heading: string; body: string }[];
  impression: string;
  disclaimer: string;
  plainText: string;
  engine: ReturnType<typeof enrichEngineResult>;
};

const DISCLAIMER =
  "Заключение сформировано калькулятором LN-RADS US (SonoGyn Pro) и не является медицинским диагнозом. " +
  "Интерпретация и клинические решения — за лечащим врачом.";

function regionLabel(region: LnRadsInput["region"]): string {
  const map: Record<string, string> = {
    head_neck: "Head & Neck",
    level_i: "Level I",
    level_ii: "Level II",
    level_iii: "Level III",
    level_iv: "Level IV",
    level_v: "Level V",
    level_vi: "Level VI",
    level_vii: "Level VII",
    axillary: "Axillary",
    internal_mammary: "Internal mammary",
    supraclavicular: "Supraclavicular",
    pelvic: "Pelvic",
    external_iliac: "External iliac",
    internal_iliac: "Internal iliac",
    obturator: "Obturator",
    common_iliac: "Common iliac",
    paraaortic: "Paraaortic",
    inguinal: "Inguinal",
    other: "Other",
  };
  return map[region] ?? region;
}

function inferTemplate(category: number): LnReportTemplate {
  if (category <= 1) return "normal";
  if (category === 2) return "reactive";
  if (category === 3) return "inflammatory";
  if (category === 4) return "suspicious";
  return "metastatic";
}

function buildSections(input: LnRadsInput, engine: ReturnType<typeof enrichEngineResult>, level: LnReportLevel) {
  const { sizeAnalysis, dopplerAnalysis, categoryMeta: meta } = engine;
  const ls = sizeAnalysis.lsRatio?.toFixed(2) ?? "н/д";

  const morphology = [
    `Локализация: ${regionLabel(input.region)}`,
    `Размеры: ${input.longAxisMm} × ${input.shortAxisMm} mm (L/S = ${ls})`,
    `Форма: ${input.shape}; кapsula: ${input.capsule}`,
    `Hilum: ${input.hilum}; кора: ${input.cortex}`,
    `Эхогенность: ${input.echogenicity}; архитектура: ${input.architecture}`,
  ].join("\n");

  const doppler = [
    `ЦДК: ${dopplerAnalysis.pattern}`,
    dopplerAnalysis.clinicalSignificance,
    level !== "short" ? dopplerAnalysis.teachingExplanation : "",
  ]
    .filter(Boolean)
    .join("\n");

  const advanced =
    level === "short"
      ? ""
      : [
          `Кальцинаты: ${input.calcifications}`,
          `Некроз: ${input.necrosis}`,
          `Кистозная дегенерация: ${input.cysticDegeneration}`,
          `ECE: ${input.extracapsularExtension}`,
          `Matting: ${input.matting}`,
          input.elastography ? `Elastography: ${input.elastography}` : "",
          input.ceus && input.ceus !== "not_assessed" ? `CEUS: ${input.ceus}` : "",
        ]
          .filter(Boolean)
          .join("\n");

  const differential =
    level === "expert"
      ? [
          "Дифференциальный диагноз:",
          ...engine.differential.mostLikely.map((p) => `• ${p.nameRu} (наиболее вероятно)`),
          ...engine.differential.alternatives.map((p) => `• ${p.nameRu}`),
        ].join("\n")
      : engine.differential.mostLikely.map((p) => p.nameRu).join(", ");

  const management = [
    `LN-RADS ${engine.category}: ${meta.definitionRu}`,
    `Риск злокачественности: ${meta.malignancyRisk}`,
    meta.managementRu,
    engine.biopsyRecommended ? "Рекомендована биопсия (FNA/core)." : "Биопсия не требуется при типичной картине.",
    engine.additionalImaging.length ? `Доп. визуализация: ${engine.additionalImaging.join("; ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const sections = [
    { heading: "Морфология", body: morphology },
    { heading: "ЦДК", body: doppler },
  ];

  if (advanced) sections.push({ heading: "Дополнительные признаки", body: advanced });
  if (differential) sections.push({ heading: "Дифференциальный диагноз", body: differential });
  sections.push({ heading: "Заключение и рекомендации", body: management });

  if (level === "expert") {
    sections.push({
      heading: "Decision path",
      body: engine.decisionPath.join("\n"),
    });
  }

  return sections;
}

export function generateStructuredReport(
  input: LnRadsInput,
  options?: { level?: LnReportLevel; template?: LnReportTemplate },
): StructuredLnReport {
  const engine = enrichEngineResult(input);
  const level = options?.level ?? "standard";
  const template = options?.template ?? inferTemplate(engine.category);
  const meta = engine.categoryMeta;

  const sections = buildSections(input, engine, level);
  const impression = `LN-RADS ${engine.category} — ${meta.label}. ${meta.managementRu}`;

  const plainText = [
    `LN-RADS US · ${LN_RADS_VERSION}`,
    "",
    ...sections.flatMap((s) => [`## ${s.heading}`, s.body, ""]),
    `Импрессия: ${impression}`,
    "",
    DISCLAIMER,
  ].join("\n");

  return {
    template,
    level,
    title: `LN-RADS ${engine.category} · ${regionLabel(input.region)}`,
    sections,
    impression,
    disclaimer: DISCLAIMER,
    plainText,
    engine,
  };
}

export function reportTemplates(): { id: LnReportTemplate; labelRu: string }[] {
  return [
    { id: "normal", labelRu: "Normal node" },
    { id: "reactive", labelRu: "Reactive node" },
    { id: "inflammatory", labelRu: "Inflammatory node" },
    { id: "suspicious", labelRu: "Suspicious node" },
    { id: "metastatic", labelRu: "Metastatic node" },
    { id: "lymphoma", labelRu: "Lymphoma" },
  ];
}
