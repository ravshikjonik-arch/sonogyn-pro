import { z } from "zod";

import { GYN_US_10_SCHEMA_VERSION } from "./types";

export const GYN_US_10_TOOL_ID = "gynecology_ultrasound_10_steps" as const;

export const ProtocolDraftStateSchema = z.object({
  schemaVersion: z.literal(GYN_US_10_SCHEMA_VERSION),
  updatedAt: z.string().min(1),
  steps: z.record(z.string(), z.record(z.string(), z.unknown())),
});

export const UpsertGynUs10DraftBodySchema = z.object({
  state: ProtocolDraftStateSchema,
  previewText: z.string().max(200_000).optional(),
  lifecycleStatus: z.enum(["draft", "finalized", "archived"]).optional(),
});

export type UpsertGynUs10DraftBody = z.infer<typeof UpsertGynUs10DraftBodySchema>;
