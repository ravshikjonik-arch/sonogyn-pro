import type { ReportTemplate } from "@repo/types";

export const OBSTETRIC_BIOMETRY_V1_TEMPLATE_SLUG = "obstetric-biometry-v1";
export const OBSTETRIC_BIOMETRY_V1_ENGINE_ID = "sre-obstetric-v1";

export const OBSTETRIC_BIOMETRY_V1_TEMPLATE: ReportTemplate = {
  id: "00000000-0000-4000-8000-000000000003",
  slug: OBSTETRIC_BIOMETRY_V1_TEMPLATE_SLUG,
  domain: "obstetric",
  version: "1.0.0",
  engineId: OBSTETRIC_BIOMETRY_V1_ENGINE_ID,
  locales: ["ru", "en"],
  titleKey: "template.obstetric_biometry_v1.title",
  descriptionKey: "template.obstetric_biometry_v1.description",
  fields: [
    { id: "gestationalAgeWeeks", type: "number", labelKey: "field.ga_weeks", required: false, group: "context" },
    { id: "gestationalAgeDays", type: "number", labelKey: "field.ga_days", required: false, group: "context" },
    { id: "crlMm", type: "measurement_mm", labelKey: "field.crl_mm", required: false, group: "measurements" },
    { id: "bpdMm", type: "measurement_mm", labelKey: "field.bpd_mm", required: false, group: "measurements" },
    { id: "hcMm", type: "measurement_mm", labelKey: "field.hc_mm", required: false, group: "measurements" },
    { id: "acMm", type: "measurement_mm", labelKey: "field.ac_mm", required: false, group: "measurements" },
    { id: "flMm", type: "measurement_mm", labelKey: "field.fl_mm", required: false, group: "measurements" },
    { id: "efwGrams", type: "number", labelKey: "field.efw_g", required: false, group: "measurements" },
    { id: "freeTextFindings", type: "text", labelKey: "field.free_text", required: false, group: "free_text" },
  ],
  isActive: true,
};
