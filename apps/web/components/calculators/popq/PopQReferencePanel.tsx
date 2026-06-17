"use client";

import { POPQ_STAGE_RULES_RU, pointLabelRu } from "@repo/medical-calculations/popq";
import type { PopQPointKey } from "@/lib/popq";

const REFERENCE_POINTS: PopQPointKey[] = ["Aa", "Ba", "C", "D", "Ap", "Bp", "TVL"];

export function PopQReferencePanel() {
  return (
    <div className="space-y-4 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/40 p-4">
      <div>
        <p className="text-sm font-bold text-[var(--clinical-foreground)]">Памятка врачу · POP-Q</p>
        <p className="mt-1 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
          Все измерения — в см относительно девственной плевы (гимена). Выше — отрицательные, ниже — положительные.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--clinical-border)] bg-white">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[var(--clinical-foreground-muted)]">
            <tr>
              <th className="px-3 py-2 font-bold">Точка</th>
              <th className="px-3 py-2 font-bold">Что измеряем</th>
            </tr>
          </thead>
          <tbody>
            {REFERENCE_POINTS.map((key) => (
              <tr key={key} className="border-t border-[var(--clinical-border)]">
                <td className="px-3 py-2 font-black text-[var(--clinical-primary-deep)]">{key}</td>
                <td className="px-3 py-2 text-[var(--clinical-foreground)]">{pointLabelRu(key)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3">
        <p className="text-xs font-bold text-blue-950">Как считать стадию</p>
        <ul className="mt-2 space-y-1 text-xs leading-relaxed text-blue-900">
          {POPQ_STAGE_RULES_RU.map((rule) => (
            <li key={rule}>• {rule}</li>
          ))}
        </ul>
      </div>

      <p className="text-[10px] leading-relaxed text-[var(--clinical-foreground-muted)]">
        Не диагноз. Интерпретация и тактика — за лечащим специалистом. Шкала POP-Q — международный стандарт
        стадирования пролапса.
      </p>
    </div>
  );
}
