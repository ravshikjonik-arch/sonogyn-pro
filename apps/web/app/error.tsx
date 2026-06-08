"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100 px-6 py-16 text-slate-900">
      <div className="max-w-lg rounded-2xl border border-slate-300 bg-white p-8 shadow-lg">
        <h1 className="text-xl font-bold text-slate-950">Ошибка на странице</h1>
        <p className="mt-2 text-sm text-slate-600">
          Откройте инструменты разработчика (F12 или ⌥⌘I) → вкладка Console — там будет точная причина. Окно «автоформатировать»
          часто от менеджера паролей или переводчика; на белом экране смотрите именно Console.
        </p>
        <pre className="mt-4 max-h-48 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-red-800">{error.message}</pre>
        <button
          type="button"
          className="mt-6 w-full rounded-xl bg-[var(--clinical-primary,#1d6fd8)] py-3 text-sm font-semibold text-white"
          onClick={() => reset()}
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );
}
