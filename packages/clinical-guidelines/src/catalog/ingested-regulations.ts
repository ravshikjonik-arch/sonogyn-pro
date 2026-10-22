import type { ClinicalGuideline } from "../types";
import ingestedRaw from "./ingested-regulations.json";

/** Approved via /admin/regulations publish → `pnpm sync:regulations-catalog` */
export const INGESTED_REGULATIONS: ClinicalGuideline[] = ingestedRaw as ClinicalGuideline[];
