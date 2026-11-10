const CUSTOM_DOMAIN_SUFFIXES = ["sonogyn-pro.ru"] as const;

export function isSonogynCustomDomainHost(hostHeader: string | null): boolean {
  const host = hostHeader?.split(":")[0]?.toLowerCase() ?? "";
  if (!host) return false;
  return CUSTOM_DOMAIN_SUFFIXES.some((suffix) => host === suffix || host === `www.${suffix}`);
}

/** www redirects here, so the bootstrap loader always runs on this origin. */
export const CUSTOM_DOMAIN_CANONICAL_ORIGIN = "https://sonogyn-pro.ru";

/** Origin header value allowed to read *.vercel.app documents (bootstrap loader), or null. */
export function customDomainCorsOrigin(originHeader: string | null): string | null {
  if (!originHeader) return null;
  try {
    const url = new URL(originHeader);
    if (url.protocol !== "https:" || url.port) return null;
    return isSonogynCustomDomainHost(url.hostname) ? url.origin : null;
  } catch {
    return null;
  }
}

/** HTML must stay well under ~16KB on the custom domain (Cloudflare proxy truncates ~20KB). */
export const CUSTOM_DOMAIN_HTML_BYTE_BUDGET = 16_384;
