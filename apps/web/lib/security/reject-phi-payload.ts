import { NextResponse } from "next/server";

import { detectPhi, detectPhiInUnknown, PHI_BLOCK_MESSAGE } from "@/lib/security/phi-detection";

export function phiBlockResponse(): NextResponse {
  return NextResponse.json({ error: PHI_BLOCK_MESSAGE, code: "phi_detected" }, { status: 400 });
}

/** Block AI requests when free-text fields contain PHI patterns. */
export function rejectIfPhiInTextFields(
  fields: Array<string | undefined | null>,
): NextResponse | null {
  const text = fields.filter((v): v is string => typeof v === "string" && v.trim().length > 0).join("\n");
  if (!text) return null;
  const check = detectPhi(text);
  if (!check.ok) return phiBlockResponse();
  return null;
}

export function rejectIfPhiInUnknown(value: unknown): NextResponse | null {
  const check = detectPhiInUnknown(value);
  if (!check.ok) return phiBlockResponse();
  return null;
}
