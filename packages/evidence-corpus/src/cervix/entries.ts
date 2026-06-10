import { CERVIX_ADDITIONAL_EVIDENCE } from "./cervix-additions";
import { CERVIX_CORE_EVIDENCE } from "./cervix-core";

/** Полка «Шейка матки · риски». */
export const CERVIX_EVIDENCE = [...CERVIX_CORE_EVIDENCE, ...CERVIX_ADDITIONAL_EVIDENCE];

export const CERVIX_TOPIC_COUNT = CERVIX_EVIDENCE.length;
