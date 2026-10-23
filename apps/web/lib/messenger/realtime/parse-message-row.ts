import { z } from "zod";

const MessengerRealtimeRowSchema = z.object({
  id: z.string().uuid(),
  chat_id: z.string().uuid(),
  seq: z.coerce.number().int().nonnegative(),
  client_uuid: z.string().uuid(),
  sender_id: z.string().uuid(),
  message_type: z.string(),
  body: z.string().nullable(),
  reply_to_message_id: z.string().uuid().nullable().optional(),
  edited_at: z.string().nullable().optional(),
  deleted_at: z.string().nullable().optional(),
  created_at: z.string(),
});

export type MessengerRealtimeRow = z.infer<typeof MessengerRealtimeRowSchema>;

export function parseMessengerRealtimeRow(raw: unknown): MessengerRealtimeRow | null {
  const parsed = MessengerRealtimeRowSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

const DoctorChatRealtimeRowSchema = z.object({
  id: z.string().uuid(),
  channel_id: z.string().uuid(),
  author_id: z.string().uuid(),
  body: z.string().nullable(),
  media_storage_path: z.string().nullable(),
  media_type: z.enum(["image", "video"]).nullable(),
  created_at: z.string(),
});

export type DoctorChatRealtimeRow = z.infer<typeof DoctorChatRealtimeRowSchema>;

export function parseDoctorChatRealtimeRow(raw: unknown): DoctorChatRealtimeRow | null {
  const parsed = DoctorChatRealtimeRowSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** If incoming seq skips a slot, caller should run gap fill. */
export function detectSeqGap(localMaxSeq: number | null, incomingSeq: number): boolean {
  if (localMaxSeq == null) return false;
  return incomingSeq > localMaxSeq + 1;
}
