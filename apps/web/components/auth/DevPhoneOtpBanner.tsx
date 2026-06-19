"use client";

type Props = {
  code: string;
};

/** Локальный тест SMS — код на экране (на телефон не приходит). */
export function DevPhoneOtpBanner({ code }: Props) {
  if (!code) return null;
  return (
    <div
      className="rounded-2xl border-2 border-emerald-500 bg-emerald-50 p-4 text-center dark:border-emerald-600 dark:bg-emerald-950/50"
      role="status"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-200">
        Тест на компьютере — SMS на телефон не приходит
      </p>
      <p className="mt-2 text-3xl font-bold tracking-[0.3em] text-emerald-900 dark:text-emerald-100">{code}</p>
      <p className="mt-2 text-xs text-emerald-800 dark:text-emerald-200">Введите этот код ниже и нажмите «Подтвердить»</p>
    </div>
  );
}
