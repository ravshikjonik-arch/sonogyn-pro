/** English prose templates for SRE (Phase 1). */
import { formatMeasurementDecimal } from "@repo/medical-calculations";

export const en = {
  report: {
    assistive_footer:
      "Assistive draft only; not a histologic diagnosis. Clinical interpretation remains with the treating specialist.",
    study_region_adnex: "Pelvis · transvaginal ultrasound · adnexa",
    study_region_thyroid: "Thyroid · ultrasound",
    study_region_obstetric: "Obstetric ultrasound · biometry",
  },
  adnex: {
    section_description: "Description",
    section_impression: "Impression",
    localization: {
      ovarian: "ovarian / adnexal",
      extraovarian: "extraovarian",
    },
    menopause: { pre: "premenopause", post: "postmenopause", unknown: "menopausal status not specified" },
    lesionKind: {
      physiological: "physiological lesion",
      nonphysiological: "non-physiological lesion",
      normal_ovary: "multifollicular / normal ovary",
    },
    structure: { unilocular: "unilocular", multilocular: "multilocular", solid: "solid" },
    septa: { thin: "thin septa", thick: "thick septa" },
    solidType: {
      smooth: "smooth solid component",
      irregular: "irregular solid component",
      papillary: "papillary projections",
    },
    bloodFlow: {
      none: "no vascularity",
      minimal: "minimal flow",
      moderate: "moderate flow",
      marked: "marked flow",
    },
    measurements: (maxMm: number, vol?: number) => {
      const parts = [`largest diameter ${formatMeasurementDecimal(maxMm)} mm`];
      if (vol != null && vol > 0) parts.push(`volume ~${Math.round(vol * 10) / 10} mL`);
      return parts.join(", ");
    },
    orads_line: (cat: number, version: string) => `O-RADS US category: ${cat} (${version}).`,
    iota_line: (verdict: string, benign: string, malignant: string) =>
      `IOTA Simple Rules: ${verdict} (B: ${benign || "—"}; M: ${malignant || "—"}).`,
    agreement: {
      full: "O-RADS US and IOTA classifications are concordant.",
      partial: "Partial agreement — verify scanning planes and morphology.",
      conflict: "O-RADS / IOTA discordance — expert ultrasound review recommended.",
    },
    pitfall_prefix: "Protocol note",
    missing_orads: "O-RADS category not provided — draft uses interim O-RADS 3; please classify.",
  },
  thyroid: {
    section_description: "Description",
    section_impression: "Impression",
    volume: (ml?: number) => (ml != null ? `Thyroid volume ${ml} mL.` : "Thyroid volume not specified."),
    nodule_size: (mm?: number) =>
      mm != null ? `Largest nodule diameter ${formatMeasurementDecimal(mm)} mm.` : "Nodule size not specified.",
    tirads_line: (label: string, points: number, risk: string) =>
      `ACR TI-RADS: ${label} · ${points} points · malignancy risk ${risk}.`,
    fna_yes: (rationale: string) => `FNA recommended. ${rationale}`,
    fna_no: (rationale: string) => `FNA not indicated. ${rationale}`,
    follow_up: (text: string) => `Follow-up: ${text}`,
  },
  obstetric: {
    section_description: "Description",
    section_impression: "Impression",
    ga: (weeks?: number, days?: number) => {
      if (weeks == null) return "Gestational age not specified.";
      const d = days ?? 0;
      return `Gestational age ${weeks}+${d} weeks (ultrasound estimate).`;
    },
    biometry_line: (label: string, mm?: number) =>
      mm != null ? `${label}: ${formatMeasurementDecimal(mm)} mm.` : `${label}: not measured.`,
    efw: (grams?: number) => (grams != null ? `Estimated fetal weight ~${grams} g.` : ""),
    placenta: (loc?: string) => (loc ? `Placenta: ${loc}.` : ""),
    fluid: (desc?: string) => (desc ? `Amniotic fluid: ${desc}.` : ""),
    recommendations: "Correlate with clinical history and local obstetric protocol.",
  },
} as const;

export type EnCatalog = typeof en;
