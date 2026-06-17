/** Обновить URL без remount Next.js (вкладки, фильтры). */
export function patchUrl(pathname: string, params: Record<string, string | undefined>) {
  if (typeof window === "undefined") return;
  const url = new URL(pathname, window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  }
  const qs = url.searchParams.toString();
  const href = qs ? `${url.pathname}?${qs}` : url.pathname;
  window.history.replaceState(null, "", href);
}
