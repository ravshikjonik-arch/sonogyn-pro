/** Allowlist clinical image URLs — Supabase Storage signed/public only (blocks SSRF to internal hosts). */

function supabaseProjectHost(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).host.toLowerCase();
  } catch {
    return null;
  }
}

export function isAllowedClinicalImageUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;

  const host = parsed.host.toLowerCase();
  const supabaseHost = supabaseProjectHost();
  if (!supabaseHost || host !== supabaseHost) return false;

  const path = parsed.pathname;
  return (
    path.includes("/storage/v1/object/") ||
    path.includes("/storage/v1/object/sign/") ||
    path.includes("/storage/v1/object/public/")
  );
}
