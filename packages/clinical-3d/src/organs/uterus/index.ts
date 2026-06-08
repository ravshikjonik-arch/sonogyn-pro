export * from "./figoClassification";
export { UterusModel, type UterusModelProps } from "./UterusModel";

/**
 * ProceduralUterus и маркеры миомы пока живут в `@clinical/uterus` (web)
 * и `apps/mobile/src/gynecology/uterus3d/` (mobile).
 * Импорт для web: `@/lib/clinical-3d-bridge` или напрямую `@clinical/uterus`.
 */
