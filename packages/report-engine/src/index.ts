export {
  renderAdnexStructuredDocument,
  renderAdnexStructuredReport,
  generateStructuredReportFromRequest,
  mapAdnexStructuredInputToCalcInput,
  resolveOradsCategory,
} from "./adnex/renderAdnexReport";

export {
  ADNEX_ORADS_V1_ENGINE_ID,
  ADNEX_ORADS_V1_TEMPLATE,
  ADNEX_ORADS_V1_TEMPLATE_SLUG,
} from "./templates/adnex-orads-v1";

export { getReportI18n } from "./i18n";
