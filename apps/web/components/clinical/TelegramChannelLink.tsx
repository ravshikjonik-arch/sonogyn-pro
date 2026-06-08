import { Send } from "lucide-react";

import { TELEGRAM_CHANNEL } from "@/lib/brand/telegram";
import { cn } from "@/lib/utils/cn";

type Props = {
  className?: string;
  compact?: boolean;
};

export function TelegramChannelLink({ className, compact }: Props) {
  return (
    <a
      href={TELEGRAM_CHANNEL.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group flex items-start gap-3 rounded-xl border border-[#229ED9]/35 bg-[#229ED9]/10 p-3 transition-colors hover:border-[#229ED9]/60 hover:bg-[#229ED9]/15",
        className,
      )}
      title={`Открыть ${TELEGRAM_CHANNEL.name} в Telegram`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#229ED9] text-white">
        <Send className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[var(--clinical-foreground)] group-hover:text-[#1a8bc7]">
          {TELEGRAM_CHANNEL.name}
        </span>
        {!compact ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
            {TELEGRAM_CHANNEL.description}
          </span>
        ) : null}
        <span className="mt-1 block text-xs font-medium text-[#229ED9]">{TELEGRAM_CHANNEL.handle}</span>
      </span>
    </a>
  );
}
