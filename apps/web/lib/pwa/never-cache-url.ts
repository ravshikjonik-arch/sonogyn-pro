/**
 * URL, которые service worker не должен кэшировать (ПДн / auth / admin).
 */
const NEVER_CACHE_PATH_PREFIXES = [
  "/api/",
  "/auth/",
  "/admin",
  "/patients",
  "/verify-phone",
  "/profile/patients",
] as const;

const NEVER_CACHE_PATH_SNIPPETS = ["verify-phone"] as const;

export function shouldNeverCacheRequest(url: URL, pathname: string): boolean {
  if (url.hostname.endsWith(".supabase.co")) return true;
  if (url.pathname.includes("/auth/v1") || url.href.includes("supabase.co/auth")) return true;

  for (const prefix of NEVER_CACHE_PATH_PREFIXES) {
    if (pathname === prefix.replace(/\/$/, "") || pathname.startsWith(prefix)) return true;
  }
  for (const snippet of NEVER_CACHE_PATH_SNIPPETS) {
    if (pathname.includes(snippet)) return true;
  }
  return false;
}
