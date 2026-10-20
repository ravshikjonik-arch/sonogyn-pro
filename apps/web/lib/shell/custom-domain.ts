const CUSTOM_DOMAIN_SUFFIXES = ["sonogyn-pro.ru"] as const;

export function isSonogynCustomDomainHost(hostHeader: string | null): boolean {
  const host = hostHeader?.split(":")[0]?.toLowerCase() ?? "";
  if (!host) return false;
  return CUSTOM_DOMAIN_SUFFIXES.some((suffix) => host === suffix || host === `www.${suffix}`);
}

/** HTML must stay well under ~16KB on the custom domain (Cloudflare proxy truncates ~20KB). */
export const CUSTOM_DOMAIN_HTML_BYTE_BUDGET = 16_384;
