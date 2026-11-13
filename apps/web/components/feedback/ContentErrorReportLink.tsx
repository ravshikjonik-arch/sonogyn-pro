"use client";

import { usePathname } from "next/navigation";

import {
  buildContentErrorReportHref,
  CONTENT_ERROR_REPORT,
} from "@/lib/brand/content-error-report";
import { cn } from "@/lib/utils/cn";

type Props = {
  /** Если задан — не берём pathname (SSR-посадочные / блог). */
  pagePath?: string;
  className?: string;
  /** Компактный вид в футере / шапке статьи */
  compact?: boolean;
};

/**
 * Единая точка «Нашли ошибку?» → Telegram @Yakrav7700.
 * Телефон не показываем.
 */
export function ContentErrorReportLink({ pagePath, className, compact = false }: Props) {
  const pathname = usePathname();
  const href = buildContentErrorReportHref(pagePath ?? pathname);

  if (compact) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "text-[var(--clinical-primary-deep)] underline-offset-2 hover:underline",
          className,
        )}
      >
        {CONTENT_ERROR_REPORT.labelRu} {CONTENT_ERROR_REPORT.ctaRu}
      </a>
    );
  }

  return (
    <p
      className={cn(
        "rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/50 px-4 py-3 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]",
        className,
      )}
    >
      <span className="font-semibold text-[var(--clinical-foreground)]">
        {CONTENT_ERROR_REPORT.labelRu}
      </span>{" "}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-[var(--clinical-primary-deep)] underline underline-offset-2"
      >
        {CONTENT_ERROR_REPORT.ctaRu}
      </a>
      <span className="mt-1 block text-xs">
        {CONTENT_ERROR_REPORT.telegramHandle}. {CONTENT_ERROR_REPORT.vpnHintRu} Без данных пациентов.
      </span>
    </p>
  );
}
