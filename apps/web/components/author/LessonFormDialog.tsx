"use client";

import { useEffect, useState } from "react";

import { RichTextEditor } from "@/components/author/RichTextEditor";
import { VideoUploader } from "@/components/author/VideoUploader";
import { Button } from "@/components/ui/button";
import { maskRuDateInput } from "@/lib/utils/ru-date";
import type { CourseLessonRow } from "@/lib/courses/types";
import { detectVideoProvider } from "@/lib/courses/video-url";

type LessonFormDialogProps = {
  open: boolean;
  courseId: string;
  moduleId: string;
  lesson: CourseLessonRow | null;
  onClose: () => void;
  onSaved: () => void;
};

function splitOfflineDateTime(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return { date: `${dd}.${mm}.${yyyy}`, time: `${hh}:${min}` };
}

function mergeOfflineDateTime(date: string, time: string): string | null {
  if (!date || !time) return null;
  const m = date.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  const t = time.match(/^(\d{2}):(\d{2})$/);
  if (!m || !t) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(t[1]), Number(t[2]));
  return d.toISOString();
}

export function LessonFormDialog({ open, courseId, moduleId, lesson, onClose, onSaved }: LessonFormDialogProps) {
  const [title, setTitle] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [lessonType, setLessonType] = useState<"video" | "offline" | "webinar">("video");
  const [videoUrl, setVideoUrl] = useState("");
  const [offlineDate, setOfflineDate] = useState("");
  const [offlineTime, setOfflineTime] = useState("");
  const [offlineAddress, setOfflineAddress] = useState("");
  const [offlineStreamUrl, setOfflineStreamUrl] = useState("");
  const [maxSeats, setMaxSeats] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [savedLessonId, setSavedLessonId] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<CourseLessonRow["video_processing_status"]>("none");
  const [savedNotice, setSavedNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle(lesson?.title ?? "Новый урок");
    setBodyHtml(lesson?.body_html ?? "<p></p>");
    setLessonType(lesson?.lesson_type ?? "video");
    setVideoUrl(lesson?.video_url ?? "");
    const { date, time } = splitOfflineDateTime(lesson?.offline_starts_at ?? null);
    setOfflineDate(date);
    setOfflineTime(time);
    setOfflineAddress(lesson?.offline_address ?? "");
    setOfflineStreamUrl(lesson?.offline_stream_url ?? "");
    setMaxSeats(lesson?.max_seats != null ? String(lesson.max_seats) : "");
    setDurationMinutes(lesson?.duration_minutes != null ? String(lesson.duration_minutes) : "");
    setIsFreePreview(lesson?.is_free_preview ?? false);
    setSavedLessonId(lesson?.id ?? null);
    setVideoStatus(lesson?.video_processing_status ?? "none");
    setSavedNotice("");
    setError("");
  }, [open, lesson]);

  if (!open) return null;

  async function onSubmit() {
    setSaving(true);
    setError("");
    const payload = {
      module_id: moduleId,
      title: title.trim(),
      body_html: bodyHtml,
      lesson_type: lessonType,
      video_url: lessonType === "video" ? videoUrl.trim() || null : null,
      offline_starts_at:
        lessonType === "offline" || lessonType === "webinar" ? mergeOfflineDateTime(offlineDate, offlineTime) : null,
      offline_address: lessonType === "offline" ? offlineAddress.trim() || null : null,
      offline_stream_url: lessonType === "offline" ? offlineStreamUrl.trim() || null : null,
      max_seats: lessonType === "offline" && maxSeats ? Number.parseInt(maxSeats, 10) : null,
      duration_minutes: durationMinutes ? Number.parseInt(durationMinutes, 10) : null,
      is_free_preview: lessonType === "webinar" ? false : isFreePreview,
    };

    const url = lesson
      ? `/api/author/courses/${courseId}/lessons/${lesson.id}`
      : `/api/author/courses/${courseId}/lessons`;
    const method = lesson ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    });
    const body = (await res.json()) as { ok?: boolean; lesson?: { id: string }; error?: unknown };

    if (!res.ok || !body.ok) {
      setSaving(false);
      setError(typeof body.error === "string" ? body.error : "Ошибка сохранения");
      return;
    }

    const lessonId = lesson?.id ?? body.lesson?.id;
    if (lessonId) setSavedLessonId(lessonId);

    setSaving(false);
    setSavedNotice("Урок сохранён. Можно загрузить видео или нажать «Готово».");
    onSaved();
  }

  function finish() {
    onClose();
  }

  const videoProvider = videoUrl.trim() ? detectVideoProvider(videoUrl) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-950">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{lesson ? "Редактировать урок" : "Новый урок"}</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Закрыть
          </Button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Название урока</span>
            <input
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Содержание</span>
            <div className="mt-2">
              <RichTextEditor value={bodyHtml} onChange={setBodyHtml} />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Длительность, мин (опционально)</span>
            <input
              type="number"
              min={1}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="45"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {(
              [
                ["video", "Видео"],
                ["offline", "Офлайн"],
                ["webinar", "Вебинар · Live"],
              ] as const
            ).map(([type, label]) => (
              <Button
                key={type}
                type="button"
                size="sm"
                variant={lessonType === type ? "default" : "secondary"}
                onClick={() => setLessonType(type)}
              >
                {label}
              </Button>
            ))}
          </div>

          {lessonType === "video" ? (
            <div className="space-y-3 rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
              <label className="block">
                <span className="text-sm font-medium">YouTube / Vimeo ссылка</span>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=…"
                  disabled={Boolean(savedLessonId && videoStatus !== "none")}
                />
                {videoProvider ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Провайдер: {videoProvider === "youtube" ? "YouTube" : "Vimeo"}
                    {videoProvider === "youtube" ? " · в РФ может тормозить — есть Vimeo и своё видео" : ""}
                  </p>
                ) : null}
                {savedLessonId && videoStatus !== "none" ? (
                  <p className="mt-1 text-xs text-slate-500">
                    Для загруженного видео внешняя ссылка отключена.
                  </p>
                ) : null}
              </label>
              {savedLessonId ? (
                <VideoUploader
                  courseId={courseId}
                  lessonId={savedLessonId}
                  processingStatus={videoStatus}
                  onUploaded={({ processingStatus }) => setVideoStatus(processingStatus as CourseLessonRow["video_processing_status"])}
                />
              ) : (
                <p className="text-xs text-slate-500">
                  Сначала сохраните урок — затем можно загрузить своё видео (до 2 ГБ).
                </p>
              )}
            </div>
          ) : lessonType === "webinar" ? (
            <div className="space-y-3 rounded-xl border border-dashed border-rose-300 p-4 dark:border-rose-800">
              <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
                Прямой эфир внутри SonoGyn Pro (LiveKit). Доступ только после оплаты курса. После эфира загрузите
                запись как видео-урок.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium">Дата эфира (ДД.ММ.ГГГГ)</span>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-900"
                    value={offlineDate}
                    onChange={(e) => setOfflineDate(maskRuDateInput(e.target.value))}
                    placeholder="21.12.2026"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Время начала</span>
                  <input
                    type="time"
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                    value={offlineTime}
                    onChange={(e) => setOfflineTime(e.target.value)}
                  />
                </label>
              </div>
              {savedLessonId ? (
                <p className="text-xs text-emerald-700">
                  Комната создана. В день эфира откройте{" "}
                  <a href={`/library/webinars/${savedLessonId}`} className="underline" target="_blank" rel="noreferrer">
                    страницу вебинара
                  </a>{" "}
                  и нажмите «Начать эфир».
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3 rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium">Дата (ДД.ММ.ГГГГ)</span>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono dark:border-slate-700 dark:bg-slate-900"
                    value={offlineDate}
                    onChange={(e) => setOfflineDate(maskRuDateInput(e.target.value))}
                    placeholder="21.12.2026"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Время</span>
                  <input
                    type="time"
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                    value={offlineTime}
                    onChange={(e) => setOfflineTime(e.target.value)}
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-medium">Адрес</span>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                  value={offlineAddress}
                  onChange={(e) => setOfflineAddress(e.target.value)}
                  placeholder="Клиника, аудитория…"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Ссылка на трансляцию</span>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                  value={offlineStreamUrl}
                  onChange={(e) => setOfflineStreamUrl(e.target.value)}
                  placeholder="https://…"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Макс. мест</span>
                <input
                  type="number"
                  min={1}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
                  value={maxSeats}
                  onChange={(e) => setMaxSeats(e.target.value)}
                />
              </label>
            </div>
          )}

          {lessonType !== "webinar" ? (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isFreePreview} onChange={(e) => setIsFreePreview(e.target.checked)} />
              Бесплатный пробный урок
            </label>
          ) : (
            <p className="text-xs text-[var(--clinical-foreground-muted)]">Вебинары — только платный доступ (без пробного урока).</p>
          )}

          {savedNotice ? <p className="text-sm text-emerald-700">{savedNotice}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Отмена
            </Button>
            {savedNotice ? (
              <Button variant="secondary" onClick={finish}>
                Готово
              </Button>
            ) : null}
            <Button onClick={() => void onSubmit()} disabled={saving}>
              {saving ? "Сохранение…" : savedNotice ? "Сохранить ещё раз" : "Сохранить урок"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
