import { createHmac, timingSafeEqual } from "crypto";

import type { RegistrationMetadata } from "@/lib/auth/registration-metadata";

export const PILOT_REGISTER_INTENT_COOKIE = "sg_pilot_reg";
const TTL_MS = 15 * 60 * 1000;

function signingKey(): string {
  const secret =
    process.env.SONOGYN_AUTH_INTERNAL_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!secret) throw new Error("Missing signing key for pilot register intent.");
  return secret;
}

function signPayload(payload: string): string {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

export function buildRegisterIntentCookie(meta: RegistrationMetadata): {
  name: string;
  value: string;
  maxAge: number;
} {
  const exp = Date.now() + TTL_MS;
  const body = JSON.stringify({ ...meta, exp });
  const encoded = Buffer.from(body, "utf8").toString("base64url");
  const sig = signPayload(encoded);
  return {
    name: PILOT_REGISTER_INTENT_COOKIE,
    value: `${encoded}.${sig}`,
    maxAge: Math.floor(TTL_MS / 1000),
  };
}

export function readRegisterIntentCookie(raw: string | undefined | null): RegistrationMetadata | null {
  if (!raw?.trim()) return null;
  const [encoded, sig] = raw.split(".");
  if (!encoded || !sig) return null;

  let expected: string;
  try {
    expected = signPayload(encoded);
  } catch {
    return null;
  }

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as RegistrationMetadata & {
      exp?: number;
    };
    if (!parsed.exp || Date.now() > parsed.exp) return null;
    if (!parsed.full_name?.trim()) return null;
    const { exp: _exp, ...meta } = parsed;
    return meta;
  } catch {
    return null;
  }
}
