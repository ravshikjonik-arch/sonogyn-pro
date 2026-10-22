/** Shareable calculator state in URL (?p= base64url JSON). Not PHI — только параметры расчёта. */

export function encodeCalculatorPayload(params: Record<string, string | number | boolean | null>): string {
  const json = JSON.stringify(params);
  const b64 =
    typeof btoa !== "undefined"
      ? btoa(unescape(encodeURIComponent(json)))
      : Buffer.from(json, "utf8").toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeCalculatorPayload(token: string | null): Record<string, string> | null {
  if (!token?.trim()) return null;
  try {
    const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const json =
      typeof atob !== "undefined"
        ? decodeURIComponent(escape(atob(b64 + pad)))
        : Buffer.from(b64 + pad, "base64").toString("utf8");
    const parsed = JSON.parse(json) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v === null || v === undefined) continue;
      out[k] = String(v);
    }
    return out;
  } catch {
    return null;
  }
}

export function buildCalculatorShareUrl(path: string, params: Record<string, string | number | boolean | null>): string {
  const token = encodeCalculatorPayload(params);
  return `${path}?p=${encodeURIComponent(token)}`;
}
