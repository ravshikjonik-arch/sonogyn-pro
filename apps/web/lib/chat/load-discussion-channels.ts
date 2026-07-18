import type { SupabaseClient } from "@supabase/supabase-js";

import {
  PILOT_CASE_DISCUSSION_CHANNELS,
  PILOT_CHAT_CHANNELS,
  type PilotChatChannel,
} from "@/lib/chat/pilot-channels";

export type DiscussionChannel = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sort_order: number;
};

function toDiscussionChannel(ch: PilotChatChannel): DiscussionChannel {
  return {
    id: ch.id,
    slug: ch.slug,
    title: ch.title,
    description: ch.description,
    sort_order: ch.sort_order,
  };
}

/** Разделы для вопросов коллегам — статический список (пилот). */
export async function loadDiscussionChannels(
  _supabase: SupabaseClient,
): Promise<DiscussionChannel[]> {
  return PILOT_CASE_DISCUSSION_CHANNELS.map(toDiscussionChannel);
}

/** Все каналы live-чата — статический список (пилот). */
export async function loadLiveChatChannels(
  _supabase: SupabaseClient,
): Promise<DiscussionChannel[]> {
  return PILOT_CHAT_CHANNELS.map(toDiscussionChannel);
}
