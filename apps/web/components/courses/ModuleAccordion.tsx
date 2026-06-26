"use client";

import Link from "next/link";
import { ChevronDown, Lock, MapPin, Video } from "lucide-react";
import { useState } from "react";

import { ProgressBar } from "@/components/courses/ProgressBar";

export type ModuleLessonItem = {
  id: string;
  title: string;
  lesson_type: "video" | "offline";
  duration_minutes?: number | null;
  is_free_preview?: boolean;
  sort_order?: number;
  locked?: boolean;
  completed?: boolean;
};

export type ModuleAccordionItem = {
  id: string;
  title: string;
  lessons: ModuleLessonItem[];
};

type ModuleAccordionProps = {
  courseId: string;
  modules: ModuleAccordionItem[];
  progressPercent?: number;
};

export function ModuleAccordion({ courseId, modules, progressPercent = 0 }: ModuleAccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(modules.slice(0, 1).map((m) => m.id)));

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {progressPercent > 0 ? <ProgressBar value={progressPercent} label="Прогресс курса" /> : null}
      {modules.map((module) => {
        const open = openIds.has(module.id);
        return (
          <div key={module.id} className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)]">
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left font-semibold"
              onClick={() => toggle(module.id)}
            >
              <span>{module.title}</span>
              <ChevronDown className={`h-5 w-5 transition ${open ? "rotate-180" : ""}`} />
            </button>
            {open ? (
              <ul className="border-t border-[var(--clinical-border)] px-2 py-2">
                {module.lessons.map((lesson) => {
                  const Icon = lesson.lesson_type === "offline" ? MapPin : Video;
                  const locked = lesson.locked && !lesson.is_free_preview;
                  const href = locked ? undefined : `/tools/refs/courses/${courseId}/lessons/${lesson.id}`;
                  return (
                    <li key={lesson.id}>
                      {href ? (
                        <Link
                          href={href}
                          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-900/40"
                        >
                          <Icon className="h-4 w-4 shrink-0 text-[var(--clinical-primary)]" />
                          <span className="flex-1">{lesson.title}</span>
                          {lesson.completed ? (
                            <span className="text-xs text-emerald-600">✓</span>
                          ) : null}
                          {lesson.is_free_preview ? (
                            <span className="text-xs text-emerald-600">пробный</span>
                          ) : null}
                          {lesson.duration_minutes ? (
                            <span className="text-xs text-slate-500">{lesson.duration_minutes} мин</span>
                          ) : null}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-400">
                          <Lock className="h-4 w-4" />
                          <span className="flex-1">{lesson.title}</span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
