/** Пилот: фиксированные каналы чата — не зависят от SELECT к БД. */

export type PilotChannelSlug =
  | "general"
  | "obstetrics"
  | "gynecology"
  | "mammology"
  | "thyroid";

export type PilotChatChannel = {
  id: string;
  slug: PilotChannelSlug;
  title: string;
  description: string;
  sort_order: number;
};

/** Live-чат: общий + специальности. */
export const PILOT_CHAT_CHANNELS: PilotChatChannel[] = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    slug: "general",
    title: "Общий чат",
    description: "Любые вопросы коллегам — без PHI.",
    sort_order: 0,
  },
  {
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    slug: "obstetrics",
    title: "Акушерство",
    description: "Беременность, скрининги, FMF, допплер.",
    sort_order: 10,
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    slug: "gynecology",
    title: "Гинекология",
    description: "Матка, яичники, O-RADS, шейка.",
    sort_order: 20,
  },
  {
    id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    slug: "mammology",
    title: "Маммология",
    description: "Молочная железа, BI-RADS.",
    sort_order: 30,
  },
  {
    id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
    slug: "thyroid",
    title: "Щитовидка",
    description: "Узлы, TI-RADS, FNA.",
    sort_order: 40,
  },
];

/** Разделы для «Вопрос коллегам» (без общего чата). */
export const PILOT_CASE_DISCUSSION_CHANNELS: PilotChatChannel[] = PILOT_CHAT_CHANNELS.filter(
  (ch) => ch.slug !== "general",
);

export function pilotChannelById(id: string): PilotChatChannel | undefined {
  return PILOT_CHAT_CHANNELS.find((ch) => ch.id === id);
}

export function pilotChannelBySlug(slug: PilotChannelSlug): PilotChatChannel {
  return PILOT_CHAT_CHANNELS.find((ch) => ch.slug === slug) ?? PILOT_CHAT_CHANNELS[0]!;
}
