import type { ReportTemplate } from "@repo/types";

export const THYROID_TIRADS_V1_TEMPLATE_SLUG = "thyroid-tirads-v1";
export const THYROID_TIRADS_V1_ENGINE_ID = "sre-thyroid-v1";

export const THYROID_TIRADS_V1_TEMPLATE: ReportTemplate = {
  id: "00000000-0000-4000-8000-000000000002",
  slug: THYROID_TIRADS_V1_TEMPLATE_SLUG,
  domain: "thyroid",
  version: "1.0.0",
  engineId: THYROID_TIRADS_V1_ENGINE_ID,
  locales: ["ru", "en"],
  titleKey: "template.thyroid_tirads_v1.title",
  descriptionKey: "template.thyroid_tirads_v1.description",
  fields: [
    { id: "composition", type: "enum", labelKey: "field.composition", required: false, group: "morphology" },
    { id: "echogenicity", type: "enum", labelKey: "field.echogenicity", required: false, group: "morphology" },
    { id: "shape", type: "enum", labelKey: "field.shape", required: false, group: "morphology" },
    { id: "margin", type: "enum", labelKey: "field.margin", required: false, group: "morphology" },
    { id: "echogenicFoci", type: "enum", labelKey: "field.echogenic_foci", required: false, group: "morphology" },
    { id: "noduleMaxDiameterMm", type: "measurement_mm", labelKey: "field.nodule_mm", required: false, group: "measurements" },
    { id: "thyroidVolumeMl", type: "number", labelKey: "field.thyroid_volume_ml", required: false, group: "measurements" },
    { id: "freeTextFindings", type: "text", labelKey: "field.free_text", required: false, group: "free_text" },
  ],
  isActive: true,
};
