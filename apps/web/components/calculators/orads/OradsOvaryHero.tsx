"use client";

import { Button } from "@/components/ui/button";
import { ORADS_VERSION_LABEL } from "@/lib/orads-pro";

type Props = {
  onContinue: () => void;
};

/** Заставка O-RADS — вместо текстового приветствия ACR */
export function OradsOvaryHero({ onContinue }: Props) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 py-12">
      <button
        type="button"
        onClick={onContinue}
        className="group w-full rounded-3xl bg-gradient-to-br from-[#0c4a6e] via-[#0e7490] to-[#14b8a6] p-8 text-center shadow-2xl ring-2 ring-cyan-400/30 transition hover:scale-[1.01] hover:shadow-cyan-500/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300"
      >
        <div className="mx-auto mb-6 flex h-36 w-36 items-center justify-center rounded-2xl bg-black/40">
          <svg viewBox="0 0 120 120" className="h-28 w-28" aria-hidden>
            <ellipse cx="60" cy="62" rx="38" ry="28" fill="none" stroke="#f472b6" strokeWidth="2.5" />
            <path
              d="M60 34 C78 38 88 52 88 62 C88 78 72 88 60 88 C48 88 32 78 32 62 C32 48 42 36 60 34"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
            />
            <circle cx="48" cy="58" r="5" fill="#38bdf8" opacity="0.85" />
            <circle cx="62" cy="54" r="4" fill="#38bdf8" opacity="0.7" />
            <circle cx="72" cy="62" r="4.5" fill="#38bdf8" opacity="0.75" />
            <circle cx="55" cy="68" r="3.5" fill="#f472b6" opacity="0.8" />
            <path d="M88 62 Q108 58 112 48" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="108" cy="46" rx="6" ry="4" fill="none" stroke="#f472b6" strokeWidth="1.5" />
          </svg>
        </div>
        <p className="text-3xl font-black tracking-tight text-white">O-RADS US</p>
        <p className="mt-1 text-sm font-bold uppercase tracking-widest text-cyan-100">Калькулятор</p>
        <p className="mt-3 text-xs leading-relaxed text-cyan-50/90">{ORADS_VERSION_LABEL}</p>
        <p className="mt-1 text-[10px] text-cyan-100/80">Ovarian-Adnexal Reporting and Data System</p>
        <p className="mt-8 text-sm font-semibold text-white group-hover:underline">Нажмите, чтобы продолжить →</p>
      </button>
      <p className="mt-6 max-w-sm text-center text-xs text-[var(--clinical-foreground-muted)]">
        Учебный модуль SonoGyn Pro. Не заменяет клиническое суждение. Далее — оценка от O-RADS 0 до 5 и IOTA при
        заполнении признаков.
      </p>
      <Button variant="outline" size="sm" className="mt-4" onClick={onContinue}>
        Пропустить заставку
      </Button>
    </div>
  );
}
