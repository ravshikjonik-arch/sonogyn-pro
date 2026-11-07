const CUSTOM_DOMAIN_SUFFIXES = ["sonogyn-pro.ru"] as const;

/** Extra hosts served like the custom domain (e.g. a test subdomain bound to a Preview). */
function extraCustomDomainHosts(): string[] {
  return (process.env.SONOGYN_EXTRA_CUSTOM_DOMAIN_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

export function isSonogynCustomDomainHost(hostHeader: string | null): boolean {
  const host = hostHeader?.split(":")[0]?.toLowerCase() ?? "";
  if (!host) return false;
  if (CUSTOM_DOMAIN_SUFFIXES.some((suffix) => host === suffix || host === `www.${suffix}`)) return true;
  return extraCustomDomainHosts().includes(host);
}

/** HTML must stay well under ~16KB on the custom domain (Cloudflare proxy truncates ~20KB). */
export const CUSTOM_DOMAIN_HTML_BYTE_BUDGET = 16_384;
