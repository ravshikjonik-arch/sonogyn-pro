export type DoctorChatMessageDto = {
  id: string;
  channel_id: string;
  author_id: string;
  body: string | null;
  media_storage_path: string | null;
  media_type: "image" | "video" | null;
  media_url?: string | null;
  created_at: string;
};

export async function fetchDoctorChatMessage(
  channelId: string,
  messageId: string,
): Promise<DoctorChatMessageDto | null> {
  const q = new URLSearchParams({ channelId, messageId });
  const res = await fetch(`/api/doctor-chat/messages?${q.toString()}`, { cache: "no-store" });
  const payload = (await res.json().catch(() => null)) as
    | { messages?: DoctorChatMessageDto[]; error?: string }
    | null;
  if (!res.ok || !payload?.messages?.[0]) return null;
  return payload.messages[0] ?? null;
}
