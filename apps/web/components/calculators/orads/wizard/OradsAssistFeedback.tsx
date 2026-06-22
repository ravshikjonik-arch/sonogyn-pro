"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { submitOradsEventFeedback } from "@/lib/orads/oradsEventsApi";

type Props = {
  eventId: string | null;
  aiCategoryNumber: number | null;
  manualCategoryNumber?: number | null;
};

export function OradsAssistFeedback({ eventId, aiCategoryNumber, manualCategoryNumber }: Props) {
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualCategory, setManualCategory] = useState<string>(
    manualCategoryNumber ? String(manualCategoryNumber) : "",
  );

  if (!eventId || done) {
    if (done) {
      return <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Спасибо! Отзыв сохранён.</p>;
    }
    return null;
  }

  async function submit(correct: boolean) {
    if (!eventId) return;
    if (!correct && !manualCategory && !manualCategoryNumber) {
      setShowManual(true);
      return;
    }

    setPending(true);
    setError(null);
    const category = correct
      ? aiCategoryNumber ?? manualCategoryNumber ?? undefined
      : Number(manualCategory || manualCategoryNumber);

    const ok = await submitOradsEventFeedback(eventId, {
      feedbackCorrect: correct,
      manualCategoryNumber:
        correct && aiCategoryNumber ? aiCategoryNumber : category && category >= 1 && category <= 5 ? category : undefined,
    });
    setPending(false);
    if (ok) setDone(true);
    else setError("Не удалось сохранить отзыв. Попробуйте позже.");
  }

  return (
    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/40">
      <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
        Правильно ли AI определил категорию{aiCategoryNumber !== null ? ` (O-RADS ${aiCategoryNumber})` : ""}?
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => void submit(true)}>
          Да
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => setShowManual(true)}>
          Нет
        </Button>
      </div>
      {showManual ? (
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-slate-600 dark:text-slate-300">
            Правильная категория
            <select
              className="ml-2 rounded border border-slate-200 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-950"
              value={manualCategory}
              onChange={(e) => setManualCategory(e.target.value)}
            >
              <option value="">—</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={String(n)}>
                  O-RADS {n}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            size="sm"
            disabled={pending || !manualCategory}
            onClick={() => void submit(false)}
          >
            Отправить
          </Button>
        </div>
      ) : null}
      {manualCategoryNumber && !showManual ? (
        <p className="text-[10px] text-slate-500">В wizard сейчас: O-RADS {manualCategoryNumber}</p>
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
