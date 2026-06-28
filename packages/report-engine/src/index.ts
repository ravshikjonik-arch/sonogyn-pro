export {
  renderAdnexStructuredDocument,
  renderAdnexStructuredReport,
  generateStructuredReportFromRequest,
  mapAdnexStructuredInputToCalcInput,
  resolveOradsCategory,
} from "./adnex/renderAdnexReport";

export {
  renderThyroidStructuredDocument,
  renderThyroidStructuredReport,
  generateThyroidReportFromRequest,
} from "./thyroid/renderThyroidReport";

export {
  renderObstetricStructuredDocument,
  renderObstetricStructuredReport,
  generateObstetricReportFromRequest,
} from "./obstetric/renderObstetricReport";

export {
  ADNEX_ORADS_V1_ENGINE_ID,
  ADNEX_ORADS_V1_TEMPLATE,
  ADNEX_ORADS_V1_TEMPLATE_SLUG,
} from "./templates/adnex-orads-v1";

export {
  THYROID_TIRADS_V1_ENGINE_ID,
  THYROID_TIRADS_V1_TEMPLATE,
  THYROID_TIRADS_V1_TEMPLATE_SLUG,
} from "./templates/thyroid-tirads-v1";

export {
  OBSTETRIC_BIOMETRY_V1_ENGINE_ID,
  OBSTETRIC_BIOMETRY_V1_TEMPLATE,
  OBSTETRIC_BIOMETRY_V1_TEMPLATE_SLUG,
} from "./templates/obstetric-biometry-v1";

export { getReportI18n } from "./i18n";
export type { ReportCatalog } from "./i18n";
