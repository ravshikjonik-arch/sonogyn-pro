"use client";

import dynamic from "next/dynamic";

export const DoctorChannelChatV2Lazy = dynamic(
  () =>
    import("@/components/chat/DoctorChannelChatV2").then((m) => ({
      default: m.DoctorChannelChatV2,
    })),
  {
    ssr: false,
    loading: () => (
      <p className="p-6 text-sm text-[var(--clinical-foreground-muted)]">Загрузка чата v2…</p>
    ),
  },
);
