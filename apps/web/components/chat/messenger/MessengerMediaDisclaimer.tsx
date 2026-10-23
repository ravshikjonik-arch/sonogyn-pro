"use client";

import { ShieldAlert } from "lucide-react";

type Props = {
  className?: string;
};

/** Teaching chat: no PHI in text; strip EXIF on images server-side — burned-in labels still forbidden. */
export function MessengerMediaDisclaimer({ className }: Props) {
  return (
    <p
      className={className}
      role="note"
    >
      <ShieldAlert className="mr-1 inline h-3.5 w-3.5 align-text-bottom text-amber-700 dark:text-amber-400" aria-hidden />
      <span className="text-[11px] leading-snug text-[var(--clinical-foreground-muted)]">
        Учебные снимки без ФИО, телефонов и номеров карт. EXIF с фото снимаем на сервере; подписи на
        кадре — обезличьте вручную. Не диагноз — интерпретация специалиста.
      </span>
    </p>
  );
}
