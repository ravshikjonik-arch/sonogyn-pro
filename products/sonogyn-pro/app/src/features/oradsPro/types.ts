export type {
  BloodFlow,
  Echogenicity,
  IotaCenterType,
  IotaColorScore,
  IotaLesionType,
  LesionKind,
  Localization,
  Menopause,
  NormalOvaryPattern,
  OradsInput,
  OradsResult,
  PapillaryProjectionCount,
  PapillaryProjectionSurface,
  PhysiologicalType,
  SeptaCount,
  SeptaThickness,
  SolidType,
  Structure,
  UnilocularSubtype,
} from "@repo/orads-us/pro";

import type { OradsInput } from "@repo/orads-us/pro";

export type AIQueueItem = {
  id: string;
  createdAt: number;
  payload: OradsInput;
  retryCount: number;
  lastError?: string;
  nextAttemptAt?: number;
};
