import {
  PLATFORM_LAUNCH_DATE_RU,
  TEST_MODE_BANNER_RU,
  TEST_MODE_SHORT_RU,
} from "@/lib/config/test-mode";

type Props = {
  /** Компактная строка (shell / узкие экраны). */
  compact?: boolean;
  className?: string;
};

/** Глобальное напоминание: полный запуск с указанной даты. */
export function TestModeBanner({ compact = false, className }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="test-mode-banner"
      className={
        className ??
        "sticky top-0 z-[60] border-b border-amber-300/80 bg-amber-100 px-3 py-2 text-center text-xs font-medium leading-snug text-amber-950 dark:border-amber-800 dark:bg-amber-950/90 dark:text-amber-50"
      }
    >
      <span className="font-semibold">{TEST_MODE_SHORT_RU}.</span>{" "}
      {compact
        ? `Без ПДн пациентов · вход — чтобы сохранить кейсы · старт ${PLATFORM_LAUNCH_DATE_RU}.`
        : TEST_MODE_BANNER_RU}
    </div>
  );
}
