"use client";

import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import type { DoctorChatChannelSlug } from "@/lib/chat/constants";
import { cn } from "@/lib/utils/cn";

export type MessengerChannelOption = {
  slug: DoctorChatChannelSlug;
  id: string;
  title: string;
  description?: string;
};

type Props = {
  channels: MessengerChannelOption[];
  activeSlug: DoctorChatChannelSlug;
  onSelectChannel: (slug: DoctorChatChannelSlug) => void;
  /** On narrow viewports: show chat pane instead of channel list. */
  mobileChatOpen: boolean;
  onMobileOpenChat: () => void;
  onMobileBack: () => void;
  chat: ReactNode;
};

export function MessengerCommunityChatShell({
  channels,
  activeSlug,
  onSelectChannel,
  mobileChatOpen,
  onMobileOpenChat,
  onMobileBack,
  chat,
}: Props) {
  const active = channels.find((c) => c.slug === activeSlug) ?? channels[0]!;

  return (
    <div className="flex min-h-[min(72vh,680px)] flex-col overflow-hidden rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] shadow-sm lg:min-h-[560px] lg:flex-row">
      <aside
        className={cn(
          "flex shrink-0 flex-col border-[var(--clinical-border)] lg:w-[min(100%,280px)] lg:border-r",
          mobileChatOpen ? "hidden lg:flex" : "flex",
        )}
        aria-label="Каналы чата"
      >
        <div className="border-b border-[var(--clinical-border)] px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
            Каналы
          </p>
        </div>
        <ul className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          {channels.map((ch) => {
            const selected = ch.slug === activeSlug;
            return (
              <li key={ch.slug}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectChannel(ch.slug);
                    onMobileOpenChat();
                  }}
                  className={cn(
                    "w-full rounded-xl px-3 py-2.5 text-left text-sm transition",
                    selected
                      ? "bg-[var(--clinical-primary-muted)] font-bold text-[var(--clinical-primary-deep)]"
                      : "text-[var(--clinical-foreground)] hover:bg-[var(--clinical-muted)]",
                  )}
                >
                  <span className="block">{ch.title}</span>
                  {ch.description ? (
                    <span className="mt-0.5 block text-[11px] font-normal text-[var(--clinical-foreground-muted)] line-clamp-2">
                      {ch.description}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <section
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col",
          mobileChatOpen ? "flex" : "hidden lg:flex",
        )}
        aria-label={active.title}
      >
        <div className="flex items-center gap-2 border-b border-[var(--clinical-border)] px-3 py-2 lg:hidden">
          <button
            type="button"
            onClick={onMobileBack}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-[var(--clinical-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            aria-label="Назад к списку каналов"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </button>
          <p className="text-sm font-bold text-[var(--clinical-foreground)]">{active.title}</p>
        </div>
        {chat}
      </section>
    </div>
  );
}
