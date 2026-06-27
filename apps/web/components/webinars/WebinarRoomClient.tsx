"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Radio, Square } from "lucide-react";
import { toast } from "sonner";

import { WebinarChatPanel } from "@/components/webinars/WebinarChatPanel";
import { WebinarPaywallCard } from "@/components/webinars/WebinarPaywallCard";
import { LessonVideoPlayer } from "@/components/lesson/LessonVideoPlayer";
import { Button } from "@/components/ui/button";
import type { WebinarSessionStatus } from "@/lib/webinars/types";

const LiveKitStage = dynamic(() => import("@/components/webinars/LiveKitStage").then((m) => m.LiveKitStage), {
  ssr: false,
  loading: () => (
    <div className="flex aspect-video items-center justify-center rounded-2xl bg-black text-white">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
});

type WebinarMeta = {
  lesson: { id: string; title: string; courseId: string; durationMinutes: number | null };
  course: { id: string; title: string; priceRub: number };
  session: {
    id: string;
    status: WebinarSessionStatus;
    scheduledAt: string;
    startedAt: string | null;
    endedAt: string | null;
  } | null;
  hasAccess: boolean;
  isHost: boolean;
  hasRecording: boolean;
  liveKitConfigured: boolean;
};

type Props = {
  lessonId: string;
  courseId: string;
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WebinarRoomClient({ lessonId, courseId }: Props) {
  const [meta, setMeta] = useState<WebinarMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [join, setJoin] = useState<{ token: string; url: string; roomName: string } | null>(null);
  const [joining, setJoining] = useState(false);
  const [lifecycleBusy, setLifecycleBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/lessons/${lessonId}/webinar`, { credentials: "same-origin" });
    const body = (await res.json()) as WebinarMeta & { ok?: boolean; error?: string };
    if (!res.ok || !body.ok) {
      toast.error(body.error ?? "Вебинар недоступен");
      setMeta(null);
      setLoading(false);
      return;
    }
    setMeta(body);
    setLoading(false);
  }, [lessonId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function joinRoom() {
    setJoining(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/webinar`, {
        method: "POST",
        credentials: "same-origin",
      });
      const body = (await res.json()) as {
        ok?: boolean;
        token?: string;
        url?: string;
        roomName?: string;
        error?: string;
      };
      if (!res.ok || !body.ok || !body.token || !body.url || !body.roomName) {
        toast.error(body.error ?? "Не удалось войти в комнату");
        return;
      }
      setJoin({ token: body.token, url: body.url, roomName: body.roomName });
    } finally {
      setJoining(false);
    }
  }

  async function lifecycle(action: "start" | "end") {
    setLifecycleBusy(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/webinar/lifecycle`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) {
        toast.error(body.error ?? "Ошибка");
        return;
      }
      toast.success(action === "start" ? "Эфир начат" : "Эфир завершён");
      await load();
      if (action === "start" && meta?.isHost) {
        await joinRoom();
      }
    } finally {
      setLifecycleBusy(false);
    }
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Загрузка вебинара…
      </p>
    );
  }

  if (!meta) {
    return (
      <div className="rounded-xl border p-6 text-center text-sm">
        Вебинар не найден.{" "}
        <Link href="/tools/refs/webinars" className="text-[var(--clinical-primary)] underline">
          К каталогу
        </Link>
      </div>
    );
  }

  if (!meta.hasAccess) {
    return (
      <WebinarPaywallCard
        courseId={courseId}
        courseTitle={meta.course.title}
        lessonTitle={meta.lesson.title}
        priceRub={meta.course.priceRub}
        scheduledAt={meta.session?.scheduledAt ?? null}
      />
    );
  }

  const status = meta.session?.status ?? "scheduled";
  const showLive = status === "live" || (meta.isHost && join);
  const showReplay = status === "ended" && meta.hasRecording;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/tools/refs/webinars" className="text-sm text-[var(--clinical-primary)] underline">
            ← Вебинары
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{meta.lesson.title}</h1>
          <p className="text-sm text-[var(--clinical-foreground-muted)]">{meta.course.title}</p>
          {meta.session?.scheduledAt ? (
            <p className="mt-1 text-xs text-slate-500">{formatWhen(meta.session.scheduledAt)}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {status === "live" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
              <Radio className="h-3 w-3" /> LIVE
            </span>
          ) : null}
          {meta.isHost && status === "scheduled" ? (
            <Button disabled={lifecycleBusy || !meta.liveKitConfigured} onClick={() => void lifecycle("start")}>
              Начать эфир
            </Button>
          ) : null}
          {meta.isHost && status === "live" ? (
            <Button variant="destructive" disabled={lifecycleBusy} onClick={() => void lifecycle("end")}>
              <Square className="mr-1 h-4 w-4" /> Завершить
            </Button>
          ) : null}
          {!meta.isHost && status === "scheduled" ? (
            <Button disabled={joining} onClick={() => void joinRoom()}>
              Войти в зал ожидания
            </Button>
          ) : null}
          {!meta.isHost && status === "live" && !join ? (
            <Button disabled={joining} onClick={() => void joinRoom()}>
              Смотреть эфир
            </Button>
          ) : null}
        </div>
      </div>

      {!meta.liveKitConfigured ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          LiveKit не настроен. Добавьте `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `NEXT_PUBLIC_LIVEKIT_URL` в Vercel.
          Чат работает; видео появится после настройки.
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          {showReplay ? (
            <div>
              <p className="mb-2 text-sm font-medium text-[var(--clinical-foreground-muted)]">Запись эфира</p>
              <LessonVideoPlayer lessonId={lessonId} />
            </div>
          ) : showLive && join && meta.liveKitConfigured ? (
            <LiveKitStage token={join.token} serverUrl={join.url} isHost={meta.isHost} />
          ) : status === "scheduled" ? (
            <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed border-[var(--clinical-border)] bg-[var(--clinical-muted)]/40 p-6 text-center text-sm text-[var(--clinical-foreground-muted)]">
              {meta.isHost
                ? "Нажмите «Начать эфир», когда будете готовы. Зрители увидят трансляцию после старта."
                : "Эфир ещё не начался. Чат открыт — можно задавать вопросы."}
            </div>
          ) : status === "ended" && !meta.hasRecording ? (
            <div className="flex aspect-video items-center justify-center rounded-2xl border border-dashed p-6 text-center text-sm text-[var(--clinical-foreground-muted)]">
              Эфир завершён. Запись появится после обработки.
            </div>
          ) : null}
        </div>

        <WebinarChatPanel
          lessonId={lessonId}
          sessionId={meta.session?.id ?? null}
          isHost={meta.isHost}
          disabled={!meta.hasAccess}
        />
      </div>
    </div>
  );
}
