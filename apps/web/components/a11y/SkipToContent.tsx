/**
 * Скрытая ссылка «к основному содержанию» — первый Tab на любой странице.
 * Цель: элемент с id="main-content" (layout / page).
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="fixed left-4 top-4 z-[100] -translate-y-[200%] rounded-lg bg-[var(--clinical-primary)] px-4 py-2 text-sm font-semibold text-white opacity-0 shadow-lg outline-none transition focus:translate-y-0 focus:opacity-100 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[var(--clinical-canvas)]"
    >
      К основному содержанию
    </a>
  );
}
