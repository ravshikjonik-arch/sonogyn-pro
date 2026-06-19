"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { GripVertical, Plus, Trash2, Video, MapPin } from "lucide-react";

import { CoverUploader } from "@/components/author/CoverUploader";
import { LessonFormDialog } from "@/components/author/LessonFormDialog";
import { NotifyStudentsPanel } from "@/components/author/NotifyStudentsPanel";
import { RichTextEditor } from "@/components/author/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CourseLessonRow, CourseModuleRow, CourseWithTree } from "@/lib/courses/types";

type CourseEditorClientProps = {
  courseId: string;
};

type ModuleWithLessons = CourseModuleRow & { lessons: CourseLessonRow[] };

function SortableModule({
  module,
  onRename,
  onDelete,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onReorderLessons,
}: {
  module: ModuleWithLessons;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onAddLesson: (moduleId: string) => void;
  onEditLesson: (lesson: CourseLessonRow) => void;
  onDeleteLesson: (id: string) => void;
  onReorderLessons: (moduleId: string, lessonIds: string[]) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: module.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const lessonSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function onLessonDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = module.lessons.findIndex((l) => l.id === active.id);
    const newIndex = module.lessons.findIndex((l) => l.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(module.lessons, oldIndex, newIndex);
    onReorderLessons(
      module.id,
      reordered.map((l) => l.id),
    );
  }

  return (
    <div ref={setNodeRef} style={style} className="rounded-2xl border border-[var(--clinical-border)] bg-white p-4 dark:bg-[var(--clinical-card)]">
      <div className="flex items-start gap-2">
        <button type="button" className="mt-1 cursor-grab text-slate-400" {...attributes} {...listeners}>
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1 space-y-3">
          <input
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950"
            value={module.title}
            onChange={(e) => onRename(module.id, e.target.value)}
            onBlur={(e) => onRename(module.id, e.target.value.trim() || "Модуль")}
          />
          <DndContext sensors={lessonSensors} collisionDetection={closestCenter} onDragEnd={onLessonDragEnd}>
            <SortableContext items={module.lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2">
                {module.lessons.map((lesson) => (
                  <SortableLessonRow
                    key={lesson.id}
                    lesson={lesson}
                    onEdit={() => onEditLesson(lesson)}
                    onDelete={() => onDeleteLesson(lesson.id)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => onAddLesson(module.id)}>
              <Plus className="mr-1 h-4 w-4" />
              Урок
            </Button>
            <Button size="sm" variant="ghost" className="text-red-600" onClick={() => onDelete(module.id)}>
              <Trash2 className="mr-1 h-4 w-4" />
              Удалить модуль
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SortableLessonRow({
  lesson,
  onEdit,
  onDelete,
}: {
  lesson: CourseLessonRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: lesson.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const Icon = lesson.lesson_type === "offline" ? MapPin : Video;

  return (
    <li ref={setNodeRef} style={style} className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-900/40">
      <button type="button" className="cursor-grab text-slate-400" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>
      <Icon className="h-4 w-4 shrink-0 text-[var(--clinical-primary)]" />
      <button type="button" className="min-w-0 flex-1 truncate text-left text-sm hover:underline" onClick={onEdit}>
        {lesson.title}
        {lesson.is_free_preview ? <span className="ml-2 text-xs text-emerald-600">· пробный</span> : null}
        {lesson.lesson_type === "video" && lesson.video_processing_status === "ready" && lesson.video_file_key ? (
          <span className="ml-2 text-xs text-blue-600">· своё видео</span>
        ) : null}
        {lesson.lesson_type === "offline" && lesson.offline_starts_at ? (
          <span className="ml-2 text-xs text-slate-500">
            · {new Date(lesson.offline_starts_at).toLocaleDateString("ru-RU")}
          </span>
        ) : null}
      </button>
      <Button size="sm" variant="ghost" className="text-red-600" onClick={onDelete}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </li>
  );
}

export function CourseEditorClient({ courseId }: CourseEditorClientProps) {
  const [course, setCourse] = useState<CourseWithTree | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [descriptionHtml, setDescriptionHtml] = useState("");
  const [status, setStatus] = useState<CourseWithTree["status"]>("draft");
  const [priceRub, setPriceRub] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [lessonDialog, setLessonDialog] = useState<{ open: boolean; moduleId: string; lesson: CourseLessonRow | null }>({
    open: false,
    moduleId: "",
    lesson: null,
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const reload = useCallback(async () => {
    const res = await fetch(`/api/author/courses/${courseId}`, { credentials: "same-origin" });
    const body = (await res.json()) as { ok?: boolean; course?: CourseWithTree; coverUrl?: string | null; error?: string };
    if (!res.ok || !body.ok || !body.course) {
      setMessage(body.error ?? "Курс не найден");
      setLoading(false);
      return;
    }
    setCourse(body.course);
    setTitle(body.course.title);
    setDescriptionHtml(body.course.description_html);
    setStatus(body.course.status);
    setPriceRub(body.course.price_rub);
    setCoverUrl(body.coverUrl ?? null);
    setLoading(false);
  }, [courseId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function saveCourseMeta() {
    setSaving(true);
    setMessage("");
    const res = await fetch(`/api/author/courses/${courseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ title, description_html: descriptionHtml, status, price_rub: priceRub }),
    });
    setSaving(false);
    if (!res.ok) {
      setMessage("Не удалось сохранить");
      return;
    }
    setMessage("Сохранено");
    void reload();
  }

  async function uploadCover(file: File) {
    const form = new FormData();
    form.set("file", file);
    const res = await fetch(`/api/author/courses/${courseId}/cover`, { method: "POST", body: form, credentials: "same-origin" });
    if (!res.ok) {
      setMessage("Ошибка загрузки обложки");
      return;
    }
    void reload();
  }

  async function addModule() {
    const res = await fetch(`/api/author/courses/${courseId}/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ title: "Новый модуль" }),
    });
    if (res.ok) void reload();
  }

  async function renameModule(id: string, newTitle: string) {
    await fetch(`/api/author/courses/${courseId}/modules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ title: newTitle }),
    });
    setCourse((prev) =>
      prev
        ? {
            ...prev,
            modules: prev.modules.map((m) => (m.id === id ? { ...m, title: newTitle } : m)),
          }
        : prev,
    );
  }

  async function deleteModule(id: string) {
    if (!window.confirm("Удалить модуль и все уроки?")) return;
    await fetch(`/api/author/courses/${courseId}/modules/${id}`, { method: "DELETE", credentials: "same-origin" });
    void reload();
  }

  async function reorderModules(moduleIds: string[]) {
    await fetch(`/api/author/courses/${courseId}/modules`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ moduleIds }),
    });
    void reload();
  }

  async function reorderLessons(moduleId: string, lessonIds: string[]) {
    await fetch(`/api/author/courses/${courseId}/lessons`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ module_id: moduleId, lessonIds }),
    });
    void reload();
  }

  async function deleteLesson(id: string) {
    if (!window.confirm("Удалить урок?")) return;
    await fetch(`/api/author/courses/${courseId}/lessons/${id}`, { method: "DELETE", credentials: "same-origin" });
    void reload();
  }

  function onModuleDragEnd(event: DragEndEvent) {
    if (!course) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = course.modules.findIndex((m) => m.id === active.id);
    const newIndex = course.modules.findIndex((m) => m.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(course.modules, oldIndex, newIndex);
    setCourse({ ...course, modules: reordered });
    void reorderModules(reordered.map((m) => m.id));
  }

  if (loading) return <p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка редактора…</p>;
  if (!course) return <p className="text-sm text-red-600">{message || "Курс не найден"}</p>;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--clinical-primary-deep)]">Редактор</p>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Курс</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild size="sm">
            <Link href="/author/courses">← Курсы</Link>
          </Button>
          <Button variant="secondary" asChild size="sm">
            <Link href={`/author/courses/${courseId}/students`}>Студенты</Link>
          </Button>
          <Button size="sm" onClick={() => void saveCourseMeta()} disabled={saving}>
            {saving ? "Сохранение…" : "Сохранить"}
          </Button>
        </div>
      </div>

      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Основное</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium">Название</span>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Описание</span>
                <div className="mt-2">
                  <RichTextEditor value={descriptionHtml} onChange={setDescriptionHtml} placeholder="Описание курса…" />
                </div>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium">Статус</span>
                  <select
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as CourseWithTree["status"])}
                  >
                    <option value="draft">Черновик</option>
                    <option value="published">Опубликован</option>
                    <option value="archived">Архив</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium">Цена, ₽</span>
                  <input
                    type="number"
                    min={0}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-950"
                    value={priceRub}
                    onChange={(e) => setPriceRub(Number.parseInt(e.target.value || "0", 10))}
                  />
                </label>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Модули и уроки</h2>
              <Button size="sm" variant="secondary" onClick={() => void addModule()}>
                <Plus className="mr-1 h-4 w-4" />
                Модуль
              </Button>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onModuleDragEnd}>
              <SortableContext items={course.modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-4">
                  {course.modules.map((module) => (
                    <SortableModule
                      key={module.id}
                      module={module}
                      onRename={renameModule}
                      onDelete={deleteModule}
                      onAddLesson={(moduleId) => setLessonDialog({ open: true, moduleId, lesson: null })}
                      onEditLesson={(lesson) => setLessonDialog({ open: true, moduleId: lesson.module_id, lesson })}
                      onDeleteLesson={deleteLesson}
                      onReorderLessons={reorderLessons}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Обложка</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <CoverUploader coverUrl={coverUrl} onUpload={uploadCover} />
              {status === "published" ? (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/library/courses/${courseId}`} target="_blank">
                    Предпросмотр курса
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
          <NotifyStudentsPanel courseId={courseId} />
        </div>
      </div>

      <LessonFormDialog
        open={lessonDialog.open}
        courseId={courseId}
        moduleId={lessonDialog.moduleId}
        lesson={lessonDialog.lesson}
        onClose={() => setLessonDialog({ open: false, moduleId: "", lesson: null })}
        onSaved={() => {
          void reload();
        }}
      />
    </div>
  );
}
