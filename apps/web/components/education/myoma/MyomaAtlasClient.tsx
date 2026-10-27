"use client";

import { useEffect, useId, useRef, useState } from "react";

import { MyomaChrome } from "@/components/education/myoma/MyomaChrome";

export type MyomaAtlasCard = {
  id: string;
  title: string;
  alt: string;
  moduleId: string;
  src: string;
  width: number;
  height: number;
};

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]";

export function MyomaAtlasClient({
  items,
  modules,
}: {
  items: MyomaAtlasCard[];
  modules: { id: string; title: string }[];
}) {
  const [moduleId, setModuleId] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const visible = moduleId === "all" ? items : items.filter((item) => item.moduleId === moduleId);
  const open = items.find((item) => item.id === openId) ?? null;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <MyomaChrome title="Атлас" kicker={`${items.length} изображений · только для обучения`}>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Фильтр по модулю">
        <button
          type="button"
          aria-pressed={moduleId === "all"}
          className={`rounded-full border px-3 py-1.5 text-sm ${focus} ${moduleId === "all" ? "border-[var(--clinical-primary)] bg-[var(--clinical-muted)]" : "border-[var(--clinical-border)]"}`}
          onClick={() => setModuleId("all")}
        >
          Все · {items.length}
        </button>
        {modules.map((module) => {
          const count = items.filter((item) => item.moduleId === module.id).length;
          if (count === 0) return null;
          return (
            <button
              key={module.id}
              type="button"
              aria-pressed={moduleId === module.id}
              className={`rounded-full border px-3 py-1.5 text-sm ${focus} ${moduleId === module.id ? "border-[var(--clinical-primary)] bg-[var(--clinical-muted)]" : "border-[var(--clinical-border)]"}`}
              onClick={() => setModuleId(module.id)}
            >
              {module.title} · {count}
            </button>
          );
        })}
      </div>
      <p className="text-sm text-[var(--clinical-foreground-muted)]">Показано {visible.length}</p>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visible.map((item) => (
          <li key={item.id} className="overflow-hidden rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)]">
            <button
              type="button"
              className={`block w-full text-left ${focus}`}
              onClick={() => setOpenId(item.id)}
              aria-label={`Открыть крупно: ${item.title}`}
            >
              <img
                src={item.src}
                alt={item.alt}
                width={item.width}
                height={item.height}
                loading="lazy"
                decoding="async"
                className="h-auto w-full object-contain"
              />
              <span className="block px-3 py-2 text-sm leading-snug text-[var(--clinical-foreground)]">{item.title}</span>
            </button>
          </li>
        ))}
      </ul>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="w-[min(100vw-1.5rem,56rem)] max-w-full rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4 text-[var(--clinical-foreground)] backdrop:bg-black/70"
        onClose={() => setOpenId(null)}
      >
        {open ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h2 id={titleId} className="text-lg font-semibold">
                {open.title}
              </h2>
              <button
                type="button"
                className={`rounded-full border border-[var(--clinical-border)] px-3 py-1 text-sm ${focus}`}
                onClick={() => dialogRef.current?.close()}
              >
                Закрыть
              </button>
            </div>
            <img
              src={open.src}
              alt={open.alt}
              width={open.width}
              height={open.height}
              className="mx-auto h-auto max-h-[75vh] w-auto max-w-full object-contain"
            />
            <p className="text-sm text-[var(--clinical-foreground-muted)]">{open.alt}</p>
          </div>
        ) : null}
      </dialog>
    </MyomaChrome>
  );
}
