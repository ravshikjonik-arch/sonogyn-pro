"use client";

import {
  PREGNANCY_ADNEXAL_MODE_TITLE_RU,
  PREGNANCY_MODE_SHORT_HINT_RU,
  PREGNANCY_ORADS_NOT_APPLICABLE_BANNER_RU,
} from "@repo/orads-us/pregnancy";

type Props = {
  className?: string;
};

/** Этап A: обязательное предупреждение — O-RADS не применяется при беременности. */
export function OradsPregnancyModeBanner({ className }: Props) {
  return (
    <aside
      role="alert"
      data-e2e-orads-pregnancy-banner
      className={
        className ??
        "rounded-xl border border-amber-500/50 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-50"
      }
    >
      <p className="font-bold tracking-tight">{PREGNANCY_ADNEXAL_MODE_TITLE_RU}</p>
      <p className="mt-2 font-semibold">{PREGNANCY_ORADS_NOT_APPLICABLE_BANNER_RU}</p>
      <p className="mt-2 text-xs opacity-90">{PREGNANCY_MODE_SHORT_HINT_RU}</p>
    </aside>
  );
}
