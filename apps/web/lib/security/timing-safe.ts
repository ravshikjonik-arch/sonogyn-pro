import crypto from "crypto";

/** Constant-time string compare — mitigates timing attacks on shared secrets. */
export function timingSafeEqual(expected: string, received: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
