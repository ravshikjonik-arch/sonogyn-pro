import {
  PILOT_CHAT_CHANNELS,
  pilotChannelBySlug,
  type PilotChannelSlug,
} from "@/lib/chat/pilot-channels";

export type DoctorChatChannelSlug = PilotChannelSlug;

export const DOCTOR_CHAT_CHANNELS = PILOT_CHAT_CHANNELS.map((ch) => ({
  id: ch.id,
  slug: ch.slug,
  title: ch.title,
  description: ch.description,
}));

export function channelBySlug(slug: DoctorChatChannelSlug) {
  const ch = pilotChannelBySlug(slug);
  return { id: ch.id, slug: ch.slug, title: ch.title, description: ch.description };
}
