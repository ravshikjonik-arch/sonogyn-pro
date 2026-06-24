import type { SupabaseClient } from "@supabase/supabase-js";

export type DiscussionChannel = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sort_order: number;
};

/** Specialty sections from doctor_chat_channels (excludes legacy live-chat slugs). */
const DISCUSSION_CHANNEL_SLUGS = new Set([
  "iota-orads",
  "fast-efast",
  "cervix-pathology",
  "breast-us",
  "vascular-us",
  "gynecology",
  "obstetrics",
]);

export async function loadDiscussionChannels(
  supabase: SupabaseClient,
): Promise<DiscussionChannel[]> {
  const { data, error } = await supabase
    .from("doctor_chat_channels")
    .select("id,slug,title,description,sort_order")
    .order("sort_order", { ascending: true });

  if (error) return [];

  return ((data ?? []) as DiscussionChannel[]).filter((ch) => DISCUSSION_CHANNEL_SLUGS.has(ch.slug));
}
