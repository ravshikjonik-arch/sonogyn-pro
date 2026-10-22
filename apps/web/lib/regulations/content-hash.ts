import { createHash } from "node:crypto";

export function regulationContentHash(parts: string[]): string {
  const h = createHash("sha256");
  for (const p of parts) h.update(p);
  h.update("\0");
  return h.digest("hex");
}
