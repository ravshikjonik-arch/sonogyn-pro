import { isSonogynCustomDomainHost } from "@/lib/shell/custom-domain";

/**
 * Login handoff from the custom domain to the deployment host.
 *
 * The custom domain renders pages from *.vercel.app without the visitor's (HttpOnly) session,
 * so sign-in-only pages there always look signed out. With the flag on, those pages are opened
 * on the deployment host instead, after a one-time code carries the login over.
 */
export const DOMAIN_HANDOFF_START_PATH = "/auth/handoff/start";
export const DOMAIN_HANDOFF_COMPLETE_PATH = "/auth/handoff/complete";

export function isDomainHandoffEnabled(): boolean {
  return process.env.SONOGYN_DOMAIN_HANDOFF?.trim() === "1";
}

export function isRscRequest(headers: Headers): boolean {
  return (
    headers.get("RSC") === "1" ||
    headers.get("next-router-state-tree") != null ||
    headers.get("next-router-prefetch") != null ||
    (headers.get("accept") ?? "").includes("text/x-component")
  );
}

function isCustomDomainOrigin(origin: string | null): boolean {
  if (!origin) return false;
  try {
    return isSonogynCustomDomainHost(new URL(origin).host);
  } catch {
    return false;
  }
}

export type HandoffGate =
  /** Full page visit on the custom domain: go through the handoff start. */
  | { kind: "start"; location: string }
  /** Router request on the custom domain: answer with a non-RSC response so the browser reloads the page. */
  | { kind: "reload" }
  /** Router request from the custom domain to the deployment host: fail it so the browser reloads on the custom domain. */
  | { kind: "block-cross-origin" };

export function customDomainHandoffGate(input: {
  enabled: boolean;
  method: string;
  pathname: string;
  search: string;
  headers: Headers;
  authRequired: boolean;
}): HandoffGate | null {
  if (!input.enabled || !input.authRequired) return null;
  if (input.method !== "GET" && input.method !== "HEAD") return null;

  const rsc = isRscRequest(input.headers);
  if (isSonogynCustomDomainHost(input.headers.get("host"))) {
    if (rsc) return { kind: "reload" };
    const next = encodeURIComponent(`${input.pathname}${input.search}`);
    return { kind: "start", location: `${DOMAIN_HANDOFF_START_PATH}?next=${next}` };
  }
  if (rsc && isCustomDomainOrigin(input.headers.get("origin"))) return { kind: "block-cross-origin" };
  return null;
}
