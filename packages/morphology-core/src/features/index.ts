import { createFeatureRegistry } from "../registry";
import { BIRADS_US_FEATURES } from "./birads-us";
import { MUSA_ADENOMYOSIS_FEATURES } from "./musa-adenomyosis";
import { ORADS_US_FEATURES } from "./orads-us";
import { TIRADS_ACR_FEATURES } from "./tirads-acr";

export { BIRADS_US_FEATURES, MUSA_ADENOMYOSIS_FEATURES, ORADS_US_FEATURES, TIRADS_ACR_FEATURES };

export const DEFAULT_FEATURE_DEFINITIONS = [
  ...ORADS_US_FEATURES,
  ...BIRADS_US_FEATURES,
  ...TIRADS_ACR_FEATURES,
  ...MUSA_ADENOMYOSIS_FEATURES,
];

export const defaultFeatureRegistry = createFeatureRegistry(DEFAULT_FEATURE_DEFINITIONS);
