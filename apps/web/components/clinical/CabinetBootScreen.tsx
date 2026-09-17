/** Tiny first paint while the cabinet hydrates — keeps custom-domain HTML under the ~16KB hang. */
export function CabinetBootScreen() {
  return (
    <div
      className="flex min-h-dvh items-center justify-center px-6 text-sm text-[var(--clinical-foreground-muted)]"
      role="status"
      aria-live="polite"
    >
      Загрузка кабинета…
    </div>
  );
}
