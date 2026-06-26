"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { OfflineLessonCard } from "@/components/courses/OfflineLessonCard";
import { VimeoPlayer } from "@/components/courses/VimeoPlayer";
import { YouTubePlayer } from "@/components/courses/YouTubePlayer";
import { LessonVideoPlayer } from "@/components/lesson/LessonVideoPlayer";
import { Button } from "@/components/ui/button";
import { extractVimeoId, extractYouTubeId } from "@/lib/courses/video-url";

type LessonData = {
  id: string;
  course_id: string;
  title: string;
  body_html?: string;
  description?: string | null;
  lesson_type: "video" | "offline";
  video_url?: string | null;
  video_provider?: string | null;
  video_file_key?: string | null;
  offline_starts_at?: string | null;
  offline_address?: string | null;
  offline_stream_url?: string | null;
  max_seats?: number | null;
  duration_minutes?: number | null;
  offline_seats?: { registered: number; maxSeats: number | null; remaining: number | null };
  user_registered?: boolean;
};

type LessonViewClientProps = {
  courseId: string;
  lessonId: string;
};

export function LessonViewClient({ courseId, lessonId }: LessonViewClientProps) {
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    const lessonsRes = await fetch(`/api/courses/${courseId}/lessons`, { credentials: "same-origin" });
    const lessonsBody = (await lessonsRes.json()) as {
      lessons?: LessonData[];
      completedLessonIds?: string[];
      error?: string;
    };

    if (!lessonsRes.ok) {
      toast.error(lessonsBody.error ?? "Нет доступа к уроку");
      setLoading(false);
      return;
    }

    const found = (lessonsBody.lessons ?? []).find((l) => l.id === lessonId) ?? null;
    setLesson(found);
    setCompleted((lessonsBody.completedLessonIds ?? []).includes(lessonId));
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, [courseId, lessonId]);

  async function completeLesson() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/complete`, { method: "POST", credentials: "same-origin" });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) {
        toast.error(body.error ?? "Ошибка");
        return;
      }
      setCompleted(true);
      toast.success("Урок отмечен пройденным");
    } finally {
      setSubmitting(false);
    }
  }

  async function registerOffline() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/lessons/${lessonId}/register`, { method: "POST", credentials: "same-origin" });
      const body = (await res.json()) as {
        ok?: boolean;
        error?: string;
        seats?: { registered: number; maxSeats: number | null };
        alreadyRegistered?: boolean;
      };
      if (!res.ok || !body.ok) {
        toast.error(body.error ?? "Не удалось записаться");
        return;
      }
      toast.success(body.alreadyRegistered ? "Вы уже записаны" : "Запись оформлена");
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Загрузка урока…
      </p>
    );
  }

  if (!lesson) {
    return (
      <div className="rounded-xl border p-6 text-center text-sm">
        Урок недоступен.{" "}
        <Link href={`/library/courses/${courseId}`} className="text-[var(--clinical-primary)] underline">
          Вернуться к курсу
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href={`/library/courses/${courseId}`} className="text-sm text-[var(--clinical-primary)] underline">
            ← К курсу
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">{lesson.title}</h1>
          {lesson.duration_minutes ? (
            <p className="text-sm text-slate-500">{lesson.duration_minutes} мин</p>
          ) : null}
        </div>
        {completed ? (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-700">
            <Check className="h-4 w-4" /> Пройден
          </span>
        ) : (
          <Button disabled={submitting} onClick={() => void completeLesson()}>
            Завершить урок
          </Button>
        )}
      </div>

      {lesson.lesson_type === "video" ? (
        <VideoBlock lesson={lesson} />
      ) : (
        <OfflineLessonCard
          title={lesson.title}
          startsAt={lesson.offline_starts_at ?? null}
          address={lesson.offline_address ?? null}
          streamUrl={lesson.offline_stream_url ?? null}
          registered={lesson.offline_seats?.registered ?? 0}
          maxSeats={lesson.max_seats ?? lesson.offline_seats?.maxSeats ?? null}
          isRegistered={lesson.user_registered}
          registering={submitting}
          onRegister={() => void registerOffline()}
        />
      )}

      {(lesson.body_html || lesson.description) && (
        <div
          className="prose max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: lesson.body_html || `<p>${lesson.description ?? ""}</p>` }}
        />
      )}
    </div>
  );
}

function VideoBlock({ lesson }: { lesson: LessonData }) {
  if (lesson.video_provider === "upload" || lesson.video_file_key) {
    return <LessonVideoPlayer lessonId={lesson.id} />;
  }

  const url = lesson.video_url ?? "";
  const yt = extractYouTubeId(url);
  if (yt) return <YouTubePlayer videoId={yt} title={lesson.title} />;

  const vimeo = extractVimeoId(url);
  if (vimeo) return <VimeoPlayer videoId={vimeo} title={lesson.title} />;

  return <LessonVideoPlayer lessonId={lesson.id} />;
}
