export type DoctorChatChannelSlug = "general" | "gynecology" | "obstetrics";

export const DOCTOR_CHAT_CHANNELS: {
  id: string;
  slug: DoctorChatChannelSlug;
  title: string;
  description: string;
}[] = [
  {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    slug: "general",
    title: "Общий чат",
    description: "Вопросы, мысли, обмен опытом — без PHI.",
  },
  {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    slug: "gynecology",
    title: "Гинекология · УЗИ",
    description: "Яичники, матка, O-RADS, эндометриоз.",
  },
  {
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    slug: "obstetrics",
    title: "Акушерство · УЗИ",
    description: "Беременность, скрининги, FMF, допплер.",
  },
];

export function channelBySlug(slug: DoctorChatChannelSlug) {
  return DOCTOR_CHAT_CHANNELS.find((c) => c.slug === slug) ?? DOCTOR_CHAT_CHANNELS[0]!;
}
