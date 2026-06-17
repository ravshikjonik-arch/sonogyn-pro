/** Flatten nested locale object to dot keys (e.g. orads.step1.localization.question). */
export function flattenLocaleKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v != null && typeof v === "object" && !Array.isArray(v)) {
      keys.push(...flattenLocaleKeys(v as Record<string, unknown>, path));
    } else {
      keys.push(path);
    }
  }
  return keys;
}

/** Resolve a dot key against a nested locale root (typically bundle.orads). */
export function getNestedLocaleValue(
  root: Record<string, unknown> | undefined,
  dotKey: string,
): string | undefined {
  if (!root) return undefined;
  const parts = dotKey.startsWith("orads.") ? dotKey.slice("orads.".length).split(".") : dotKey.split(".");
  let cur: unknown = root;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}
