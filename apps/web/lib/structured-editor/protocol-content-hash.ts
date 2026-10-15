import { createHash } from "node:crypto";

import type { StructuredProtocolDraft } from "@repo/types";

/** SHA-256 over canonical JSON — integrity check, not a qualified e-signature. */
export function computeProtocolContentHash(draft: StructuredProtocolDraft): string {
  const canonical = JSON.stringify({
    templateVersion: draft.templateVersion,
    algorithmVersion: draft.algorithmVersion ?? null,
    algorithmDate: draft.algorithmDate ?? null,
    scaleSource: draft.scaleSource ?? null,
    sections: draft.sections,
  });
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}
