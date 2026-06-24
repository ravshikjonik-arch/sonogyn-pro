export * from "./domain";
export { evaluateCpiCase } from "./application/evaluate-case.handler";
export * from "./calculators";
export * from "./protocols/report-generator";
export * from "./ai/providers";
export * from "./ai/colposcopy-service";
export type { CpiCaseRecord, CpiPersistResult } from "./infrastructure/supabase/cpi-repository";
export { SupabaseCpiRepository } from "./infrastructure/supabase/cpi-repository";
