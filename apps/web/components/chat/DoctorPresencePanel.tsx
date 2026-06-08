"use client";

import { Circle, Users, Wifi, WifiOff } from "lucide-react";

import { useDoctorPresence } from "@/hooks/useDoctorPresence";
import { formatLastSeen } from "@/lib/chat/presence";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

function MemberRow({
  name,
  online,
  lastSeen,
  isMe,
}: {
  name: string;
  online: boolean;
  lastSeen?: string;
  isMe?: boolean;
}) {
  return (
    <li className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm">
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          online ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" : "bg-slate-400",
        )}
        aria-hidden
      />
      <span className="min-w-0 flex-1 truncate font-medium">
        {name}
        {isMe ? <span className="text-[10px] text-[var(--clinical-foreground-muted)]"> · вы</span> : null}
      </span>
      {!online && lastSeen ? (
        <span className="shrink-0 text-[10px] text-[var(--clinical-foreground-muted)]">
          {formatLastSeen(lastSeen)}
        </span>
      ) : null}
    </li>
  );
}

export function DoctorPresencePanel({ compact }: { compact?: boolean }) {
  const { loading, error, online, offline, onlineCount, offlineCount, totalCount, currentUserId } =
    useDoctorPresence();

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="gap-1 bg-emerald-600">
          <Wifi className="h-3 w-3" />
          Онлайн: {loading ? "…" : onlineCount}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <WifiOff className="h-3 w-3" />
          Оффлайн: {loading ? "…" : offlineCount}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <Users className="h-3 w-3" />
          Всего: {loading ? "…" : totalCount}
        </Badge>
      </div>
    );
  }

  return (
    <aside className="sonogyn-glass-card sticky top-20 space-y-4 rounded-2xl border border-[var(--clinical-border)] p-4">
      <div className="space-y-2">
        <p className="flex items-center gap-2 text-sm font-black">
          <Users className="h-4 w-4 text-[var(--clinical-primary)]" />
          Врачи в сообществе
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge className="gap-1 bg-emerald-600">
            <Circle className="h-2 w-2 fill-current" />
            Онлайн · {loading ? "…" : onlineCount}
          </Badge>
          <Badge variant="outline" className="gap-1">
            Оффлайн · {loading ? "…" : offlineCount}
          </Badge>
        </div>
        <p className="text-[10px] text-[var(--clinical-foreground-muted)]">
          Учёт по heartbeat · обновление каждые ~45 с · всего в базе: {totalCount}
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-amber-300/60 bg-amber-50/80 p-2 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          {error}
        </p>
      ) : null}

      {!currentUserId && !loading ? (
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          Войдите — ваш статус «онлайн» увидят коллеги.
        </p>
      ) : null}

      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
          В сети
        </p>
        {loading ? (
          <p className="text-xs text-[var(--clinical-foreground-muted)]">Загрузка…</p>
        ) : online.length === 0 ? (
          <p className="text-xs text-[var(--clinical-foreground-muted)]">Пока никого в сети</p>
        ) : (
          <ul className="max-h-40 space-y-0.5 overflow-y-auto">
            {online.map((m) => (
              <MemberRow
                key={m.userId}
                name={m.displayName}
                online
                isMe={m.userId === currentUserId}
              />
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
          Не в сети
        </p>
        {loading ? (
          <p className="text-xs text-[var(--clinical-foreground-muted)]">Загрузка…</p>
        ) : offline.length === 0 ? (
          <p className="text-xs text-[var(--clinical-foreground-muted)]">Нет записей</p>
        ) : (
          <ul className="max-h-48 space-y-0.5 overflow-y-auto">
            {offline.map((m) => (
              <MemberRow
                key={m.userId}
                name={m.displayName}
                online={false}
                lastSeen={m.lastSeenAt}
                isMe={m.userId === currentUserId}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
