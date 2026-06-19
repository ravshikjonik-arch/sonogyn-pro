"use client";

import { Calendar, MapPin, Video } from "lucide-react";

import { SeatsCounter } from "@/components/courses/SeatsCounter";
import { Button } from "@/components/ui/button";

type OfflineLessonCardProps = {
  title: string;
  startsAt: string | null;
  address: string | null;
  streamUrl: string | null;
  registered: number;
  maxSeats: number | null;
  isRegistered?: boolean;
  registering?: boolean;
  onRegister?: () => void;
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "Дата уточняется";
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OfflineLessonCard({
  title,
  startsAt,
  address,
  streamUrl,
  registered,
  maxSeats,
  isRegistered,
  registering,
  onRegister,
}: OfflineLessonCardProps) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--clinical-border)] bg-[var(--clinical-card)] p-6 space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="flex items-start gap-2 text-sm text-[var(--clinical-foreground-muted)]">
        <Calendar className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{formatDateTime(startsAt)}</span>
      </div>
      {address ? (
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--clinical-primary)]" />
          <span>{address}</span>
        </div>
      ) : null}
      {streamUrl ? (
        <div className="flex items-start gap-2 text-sm">
          <Video className="mt-0.5 h-4 w-4 shrink-0" />
          <a href={streamUrl} className="text-[var(--clinical-primary)] underline" target="_blank" rel="noreferrer">
            Ссылка на трансляцию
          </a>
        </div>
      ) : (
        <p className="text-xs text-slate-500">
          Zoom недоступен? Создайте встречу в Telegram Video Call и добавьте ссылку в редакторе урока.
        </p>
      )}
      <SeatsCounter registered={registered} maxSeats={maxSeats} />
      {onRegister ? (
        <Button disabled={registering || isRegistered || (maxSeats != null && registered >= maxSeats)} onClick={onRegister}>
          {isRegistered ? "Вы записаны" : "Записаться на лекцию"}
        </Button>
      ) : null}
    </div>
  );
}
