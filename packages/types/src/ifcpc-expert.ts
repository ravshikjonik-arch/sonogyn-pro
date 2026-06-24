/**
 * Re-exports IFCPC Expert API schemas for web/mobile API routes.
 * Source of truth: `@repo/ifcpc-expert`.
 */
export {
  CreateIfcpcExamBodySchema,
  IfcpcColposcopyExamSchema,
  IfcpcExamResponseSchema,
  IfcpcNomenclatureResponseSchema,
  IfcpcSignLookupQuerySchema,
  UpdateIfcpcExamBodySchema,
  type CreateIfcpcExamBody,
  type IfcpcColposcopyExamInput,
  type IfcpcNomenclatureResponse,
  type IfcpcSignLookupQuery,
  type UpdateIfcpcExamBody,
} from "@repo/ifcpc-expert";

export type {
  IfcpcColposcopyExam,
  IfcpcExamAssessment,
  IfcpcSignDefinition,
  IfcpcSectionDefinition,
  IfcpcSectionId,
} from "@repo/ifcpc-expert";
