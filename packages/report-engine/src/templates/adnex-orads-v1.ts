import type { ReportTemplate } from "@repo/types";

export const ADNEX_ORADS_V1_TEMPLATE_SLUG = "adnex-orads-v1";
export const ADNEX_ORADS_V1_ENGINE_ID = "sre-adnex-v1";

/** Seed template for DB bootstrap / static catalog (Phase 1). */
export const ADNEX_ORADS_V1_TEMPLATE: ReportTemplate = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: ADNEX_ORADS_V1_TEMPLATE_SLUG,
  domain: "adnex",
  version: "1.0.0",
  engineId: ADNEX_ORADS_V1_ENGINE_ID,
  locales: ["ru", "en"],
  titleKey: "template.adnex_orads_v1.title",
  descriptionKey: "template.adnex_orads_v1.description",
  fields: [
    { id: "menopause", type: "enum", labelKey: "field.menopause", required: true, group: "context" },
    { id: "localization", type: "enum", labelKey: "field.localization", required: true, group: "context" },
    { id: "structure", type: "enum", labelKey: "field.structure", required: false, group: "morphology" },
    { id: "lengthMm", type: "measurement_mm", labelKey: "field.length_mm", required: false, group: "measurements" },
    { id: "widthMm", type: "measurement_mm", labelKey: "field.width_mm", required: false, group: "measurements" },
    { id: "heightMm", type: "measurement_mm", labelKey: "field.height_mm", required: false, group: "measurements" },
    { id: "oradsCategory", type: "orads_category", labelKey: "field.orads_category", required: false, group: "classification" },
    { id: "iotaColorScore", type: "iota_color_score", labelKey: "field.iota_color_score", required: false, group: "classification" },
    { id: "freeTextFindings", type: "text", labelKey: "field.free_text", required: false, group: "free_text" },
  ],
  isActive: true,
};
