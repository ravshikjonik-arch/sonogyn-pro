import type { SupabaseClient } from "@supabase/supabase-js";

import type { MessengerAttachmentRow, MessengerMessageRow } from "@repo/types";

import { getChatMediaSignedUrl } from "@/lib/supabase/chat-media-storage";

type AttachmentRow = {
  id: string;
  message_id: string;
  storage_path: string;
  media_type: string;
  byte_size: number | null;
  width: number | null;
  height: number | null;
  preview_storage_path: string | null;
};

export type MessengerMessageDto = MessengerMessageRow & {
  attachments: (MessengerAttachmentRow & { media_url: string | null })[];
};

export async function enrichMessengerMessages(
  supabase: SupabaseClient,
  messages: MessengerMessageRow[],
  attachments: AttachmentRow[],
): Promise<MessengerMessageDto[]> {
  const byMessage = new Map<string, AttachmentRow[]>();
  for (const a of attachments) {
    const list = byMessage.get(a.message_id) ?? [];
    list.push(a);
    byMessage.set(a.message_id, list);
  }

  return Promise.all(
    messages.map(async (msg) => {
      const rows = byMessage.get(msg.id) ?? [];
      const enriched = await Promise.all(
        rows.map(async (a) => ({
          id: a.id,
          message_id: a.message_id,
          storage_path: a.storage_path,
          media_type: a.media_type as MessengerAttachmentRow["media_type"],
          byte_size: a.byte_size,
          width: a.width,
          height: a.height,
          preview_storage_path: a.preview_storage_path,
          media_url: await getChatMediaSignedUrl(supabase, a.storage_path),
        })),
      );
      return { ...msg, attachments: enriched };
    }),
  );
}
