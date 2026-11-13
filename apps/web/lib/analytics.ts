/** Barrel: единая точка входа для product/funnel analytics. */
export type { FunnelEvent } from "./analytics/track";
export { track } from "./analytics/track";
export {
  isGa4Configured,
  isMarketingAnalyticsConfigured,
  isYandexMetrikaConfigured,
  readGaMeasurementId,
  readYandexMetrikaId,
} from "./analytics/config";
