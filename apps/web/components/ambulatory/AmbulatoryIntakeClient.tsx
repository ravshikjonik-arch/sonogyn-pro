"use client";

import {
  AMBULATORY_INTAKE_DISCLAIMER,
  AMBULATORY_INTAKE_SECTIONS,
  AMBULATORY_INTAKE_STORAGE_KEY,
  AmbulatoryIntakeDraftSchema,
  CHART_FIELD_IDS,
  CHART_FIELD_LABELS,
  REGULATORY_CHECK_LINKS,
  buildChartNoteDraft,
  countMarkedItems,
  createEmptyDraft,
  type AmbulatoryIntakeDraft,
  type ChartFieldId,
  type ChecklistItem,
  type ItemStatus,
} from "@repo/ambulatory-intake";
import { Check, Circle, Copy, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

function loadDraft(): AmbulatoryIntakeDraft {
  if (typeof window === "undefined") return createEmptyDraft();
  try {
    const raw = window.localStorage.getItem(AMBULATORY_INTAKE_STORAGE_KEY);
    if (!raw) return createEmptyDraft();
    const parsed = AmbulatoryIntakeDraftSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : createEmptyDraft();
  } catch {
    return createEmptyDraft();
  }
}

function persistDraft(draft: AmbulatoryIntakeDraft) {
  window.localStorage.setItem(AMBULATORY_INTAKE_STORAGE_KEY, JSON.stringify(draft));
}

function cycleStatus(current: ItemStatus): ItemStatus {
  if (current === "empty") return "done";
  if (current === "done") return "not_indicated";
  return "empty";
}

function ItemRow({
  item,
  status,
  note,
  onCycle,
  onNote,
}: {
  item: ChecklistItem;
  status: ItemStatus;
  note: string;
  onCycle: () => void;
  onNote: (value: string) => void;
}) {
  const mark =
    status === "done" ? (
      <Check className="h-4 w-4 text-[var(--clinical-primary)]" aria-hidden />
    ) : status === "not_indicated" ? (
      <span className="text-[10px] font-semibold uppercase text-[var(--clinical-foreground-muted)]">н/п</span>
    ) : (
      <Circle className="h-4 w-4 text-[var(--clinical-foreground-muted)]" aria-hidden />
    );

  const statusLabel =
    status === "done" ? "выполнено" : status === "not_indicated" ? "не показано" : "не отмечено";

  return (
    <div className="space-y-1.5 rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-surface)] px-3 py-2">
      <button
        type="button"
        onClick={onCycle}
        className={cn(
          "flex w-full items-start gap-3 text-left text-sm",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]",
        )}
        aria-pressed={status === "done"}
        aria-label={`${item.label}: ${statusLabel}. Нажмите, чтобы сменить статус.`}
      >
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">{mark}</span>
        <span className="leading-snug text-[var(--clinical-foreground)]">{item.label}</span>
      </button>
      {item.allowsNote ? (
        <input
          type="text"
          value={note}
          onChange={(e) => onNote(e.target.value)}
          placeholder="Уточнение (необязательно)"
          className="ml-8 w-[calc(100%-2rem)] rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-2 py-1.5 text-xs text-[var(--clinical-foreground)]"
          aria-label={`Уточнение: ${item.label}`}
        />
      ) : null}
    </div>
  );
}

export function AmbulatoryIntakeClient() {
  const [draft, setDraft] = useState<AmbulatoryIntakeDraft>(() => createEmptyDraft());
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDraft(loadDraft());
    setHydrated(true);
  }, []);

  const update = useCallback((next: AmbulatoryIntakeDraft) => {
    const withTs = { ...next, updatedAt: new Date().toISOString() };
    setDraft(withTs);
    persistDraft(withTs);
  }, []);

  const setItemStatus = useCallback(
    (itemId: string, status: ItemStatus) => {
      const prev = draft.itemStates[itemId];
      update({
        ...draft,
        itemStates: {
          ...draft.itemStates,
          [itemId]: { status, note: prev?.note },
        },
      });
    },
    [draft, update],
  );

  const setItemNote = useCallback(
    (itemId: string, note: string) => {
      const prev = draft.itemStates[itemId] ?? { status: "empty" as const };
      update({
        ...draft,
        itemStates: {
          ...draft.itemStates,
          [itemId]: { ...prev, note },
        },
      });
    },
    [draft, update],
  );

  const setChartField = useCallback(
    (fieldId: ChartFieldId, value: string) => {
      update({
        ...draft,
        chartFields: { ...draft.chartFields, [fieldId]: value },
      });
    },
    [draft, update],
  );

  const counts = useMemo(() => countMarkedItems(draft), [draft]);
  const noteText = useMemo(() => buildChartNoteDraft(draft), [draft]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(noteText);
      setCopied(true);
      toast.success("Черновик записи скопирован");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Не удалось скопировать — выделите текст вручную");
    }
  }, [noteText]);

  const handleReset = useCallback(() => {
    if (!window.confirm("Сбросить локальный черновик чек-листа?")) return;
    const empty = createEmptyDraft();
    setDraft(empty);
    persistDraft(empty);
    toast.message("Черновик очищен");
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-28">
      <header className="space-y-2">
        <Link href="/tools/calc/appointment" className="text-sm font-medium text-[var(--clinical-foreground-muted)]">
          ← Приём · быстрые
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--clinical-primary-deep)]">
          Врач · амбулаторный приём АГ
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--clinical-foreground)]">
          Чек-лист первичного приёма
        </h1>
        <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
          Отмечайте только фактически выполненные пункты. Пустой пункт — не делали; «н/п» — не показано. Галочки не
          ставятся автоматически.
        </p>
        <p className="rounded-xl border border-dashed border-[var(--clinical-border)] bg-[var(--clinical-surface)] px-3 py-2 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
          {AMBULATORY_INTAKE_DISCLAIMER}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--clinical-foreground-muted)]">
        <span>
          Отмечено: {counts.done} · не показано: {counts.notIndicated}
          {hydrated ? "" : " · загрузка…"}
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Сбросить
          </Button>
          <Button type="button" size="sm" onClick={() => void handleCopy()}>
            <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            {copied ? "Скопировано" : "Скопировать запись"}
          </Button>
        </div>
      </div>

      {AMBULATORY_INTAKE_SECTIONS.map((section) => (
        <section key={section.id} className="space-y-3">
          <header>
            <h2 className="text-lg font-semibold text-[var(--clinical-foreground)]">
              {section.number}. {section.title}
            </h2>
            {section.hint ? (
              <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">{section.hint}</p>
            ) : null}
          </header>

          {section.items?.length ? (
            <div className="space-y-2">
              {section.items.map((item) => {
                const state = draft.itemStates[item.id];
                return (
                  <ItemRow
                    key={item.id}
                    item={item}
                    status={state?.status ?? "empty"}
                    note={state?.note ?? ""}
                    onCycle={() => setItemStatus(item.id, cycleStatus(state?.status ?? "empty"))}
                    onNote={(value) => setItemNote(item.id, value)}
                  />
                );
              })}
            </div>
          ) : null}

          {section.subsections?.map((sub) => (
            <div key={sub.id} className="space-y-2">
              <h3 className="px-1 text-sm font-semibold text-[var(--clinical-foreground-muted)]">{sub.title}</h3>
              {sub.items.map((item) => {
                const state = draft.itemStates[item.id];
                return (
                  <ItemRow
                    key={item.id}
                    item={item}
                    status={state?.status ?? "empty"}
                    note={state?.note ?? ""}
                    onCycle={() => setItemStatus(item.id, cycleStatus(state?.status ?? "empty"))}
                    onNote={(value) => setItemNote(item.id, value)}
                  />
                );
              })}
            </div>
          ))}
        </section>
      ))}

      <section className="space-y-3">
        <header>
          <h2 className="text-lg font-semibold text-[var(--clinical-foreground)]">8. Запись в карту — каркас</h2>
          <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">
            Заполните только то, что собрали на приёме. Пустые поля останутся как «[внести]» в копии.
          </p>
        </header>
        <div className="space-y-3">
          {CHART_FIELD_IDS.map((fieldId) => (
            <label key={fieldId} className="block space-y-1">
              <span className="text-xs font-semibold text-[var(--clinical-foreground-muted)]">
                {CHART_FIELD_LABELS[fieldId]}
              </span>
              <textarea
                value={draft.chartFields[fieldId] ?? ""}
                onChange={(e) => setChartField(fieldId, e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 py-2 text-sm text-[var(--clinical-foreground)]"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="space-y-2 rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-surface)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--clinical-foreground)]">Нормативная актуальность</h2>
        <p className="text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
          Реквизиты приказов и программ требуют проверки на дату приёма. Не используйте формулировки «обязательно по
          приказу» без сверки пункта в официальном источнике. Автоконтроль НПА — следующий этап.
        </p>
        <ul className="flex flex-wrap gap-3 text-xs">
          {REGULATORY_CHECK_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--clinical-primary)] underline-offset-2 hover:underline"
              >
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <Link href="/tools/refs/guidelines" className="underline-offset-2 hover:underline">
              КР в кабинете
            </Link>
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-[var(--clinical-foreground)]">Предпросмотр записи</h2>
          <Button type="button" size="sm" variant="outline" onClick={() => void handleCopy()}>
            <Copy className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Копировать
          </Button>
        </div>
        <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-3 text-xs leading-relaxed text-[var(--clinical-foreground)]">
          {noteText}
        </pre>
      </section>
    </div>
  );
}
