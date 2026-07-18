"use client";

import { useMemo, useState } from "react";
import { Clipboard, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { parseOradsText } from "@/lib/orads-pro/text-parser";
import { calculateORADS } from "@/lib/orads-pro";
import { cn } from "@/lib/utils/cn";

const CONFIDENCE_LABEL: Record<"high" | "medium" | "low", string> = {
  high: "высокая",
  medium: "средняя",
  low: "низкая",
};

function categoryTone(category: number) {
  if (category <= 2) return "border-emerald-300 bg-emerald-50 text-emerald-950";
  if (category === 3) return "border-amber-300 bg-amber-50 text-amber-950";
  if (category === 4) return "border-orange-300 bg-orange-50 text-orange-950";
  return "border-red-300 bg-red-50 text-red-950";
}

export function OradsTextCalculator() {
  const [text, setText] = useState(
    "Пременопауза. В левом яичнике однокамерная анэхогенная киста 42 x 31 x 30 мм, без солидного компонента, кровоток не определяется, асцита нет.",
  );

  const parsed = useMemo(() => parseOradsText(text), [text]);
  const result = useMemo(() => calculateORADS(parsed.input), [parsed.input]);

  function copyProtocol() {
    void navigator.clipboard.writeText(parsed.protocolLine).then(() => toast.success("Строка скопирована"));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 lg:px-10">
      <section className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Wand2 className="h-4 w-4 text-[var(--clinical-primary)]" />
          <p className="text-sm font-black text-[var(--clinical-foreground)]">O-RADS по тексту протокола</p>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
          Вставьте описание УЗИ. Система извлекает признаки и считает предварительную категорию. Это не заменяет
          ручную проверку: спорные признаки нужно подтвердить в пошаговом режиме.
        </p>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={7}
          className="mt-4 w-full rounded-xl border border-[var(--clinical-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--clinical-primary)]"
          placeholder="Например: однокамерная анэхогенная киста 45 мм, без солидного компонента, кровоток не определяется..."
        />
      </section>

      <section className={cn("rounded-2xl border p-4 shadow-sm", categoryTone(result.category))}>
        <p className="text-xs font-bold uppercase">Предварительный результат</p>
        <div className="mt-2 flex flex-wrap items-end gap-3">
          <p className="text-4xl font-black">O-RADS {result.category}</p>
          <p className="pb-1 text-sm font-bold">{result.riskText}</p>
        </div>
        <p className="mt-3 text-sm">{result.rationale}</p>
        <p className="mt-2 text-sm font-semibold">{result.recommendation}</p>
        {result.warning ? <p className="mt-2 text-xs">{result.warning}</p> : null}
      </section>

      <section className="grid gap-4 md:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4">
          <p className="text-sm font-black text-[var(--clinical-foreground)]">Извлеченные признаки</p>
          <div className="mt-3 space-y-2">
            {parsed.findings.map((finding) => (
              <div key={`${finding.label}-${finding.value}`} className="rounded-xl bg-[var(--clinical-muted)] px-3 py-2">
                <p className="text-xs font-bold text-[var(--clinical-foreground)]">{finding.label}</p>
                <p className="text-sm text-[var(--clinical-foreground-muted)]">
                  {finding.value} · уверенность: {CONFIDENCE_LABEL[finding.confidence]}
                </p>
              </div>
            ))}
            {parsed.findings.length === 0 ? (
              <p className="text-sm text-[var(--clinical-foreground-muted)]">Признаки пока не найдены.</p>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4">
          <p className="text-sm font-black text-[var(--clinical-foreground)]">Что проверить врачу</p>
          <div className="mt-3 space-y-2">
            {parsed.warnings.map((warning) => (
              <p key={warning} className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-950">
                {warning}
              </p>
            ))}
            {parsed.warnings.length === 0 ? (
              <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
                Основные признаки найдены. Все равно проверьте результат перед использованием в протоколе.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-black text-[var(--clinical-foreground)]">Строка для протокола</p>
          <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={copyProtocol}>
            <Clipboard className="h-4 w-4" />
            Скопировать
          </Button>
        </div>
        <p className="mt-3 rounded-xl bg-[var(--clinical-muted)] px-3 py-2 text-sm text-[var(--clinical-foreground)]">
          {parsed.protocolLine}
        </p>
      </section>
    </div>
  );
}
