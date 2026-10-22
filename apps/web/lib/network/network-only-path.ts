/**
 * Маршруты клинического кабинета, где контент и действия требуют сеть (не SW-кэш PHI/API).
 * Префиксное сравнение: `/cases/foo` → `/cases`.
 */
const NETWORK_ONLY_PREFIXES = [
  "/cases",
  "/feed",
  "/profile/patients",
  "/ai",
  "/workspace",
  "/tools/refs/evidence-assistant",
] as const;

export function isNetworkOnlyPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const path = pathname.split("?")[0]?.split("#")[0] ?? "";
  if (!path.startsWith("/")) return false;
  return NETWORK_ONLY_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}
