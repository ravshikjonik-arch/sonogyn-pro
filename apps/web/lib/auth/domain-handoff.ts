import crypto from "crypto";
import { z } from "zod";

import { getUpstashRestCredentials } from "@/lib/security/upstash-env";
import { defaultPostAuthPath } from "@/lib/nav/post-auth-landing";
import { safeInternalPath } from "@/lib/nav/safe-redirect";

/** A code lives just long enough for one redirect between the two hosts. */
export const DOMAIN_HANDOFF_TTL_SEC = 60;
const KEY_PREFIX = "sonogyn:domain-handoff:";

/** 32 random bytes in base64url. */
export const HandoffCodeSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

const HandoffGrantSchema = z.object({
  tokenHash: z.string().min(1),
  userId: z.string().uuid(),
  next: z.string(),
});
export type HandoffGrant = z.infer<typeof HandoffGrantSchema>;

export type HandoffStore = {
  put(key: string, grant: HandoffGrant, ttlSec: number): Promise<boolean>;
  /** Returns the value and deletes it in one step, so a code works once. */
  take(key: string): Promise<unknown>;
};

/** Only a hash of the code is stored, so the store never holds a usable code. */
function storageKey(code: string): string {
  return KEY_PREFIX + crypto.createHash("sha256").update(code).digest("hex");
}

export function newHandoffCode(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function memoryHandoffStore(now: () => number = Date.now): HandoffStore {
  const entries = new Map<string, { grant: HandoffGrant; expiresAt: number }>();
  return {
    async put(key, grant, ttlSec) {
      entries.set(key, { grant, expiresAt: now() + ttlSec * 1000 });
      return true;
    },
    async take(key) {
      const entry = entries.get(key);
      entries.delete(key);
      if (!entry || entry.expiresAt <= now()) return null;
      return entry.grant;
    },
  };
}

function redisHandoffStore(creds: { url: string; token: string }): HandoffStore {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis");
  const redis = new Redis({ url: creds.url, token: creds.token });
  return {
    async put(key, grant, ttlSec) {
      try {
        await redis.set(key, grant, { ex: ttlSec });
        return true;
      } catch {
        return false;
      }
    },
    async take(key) {
      try {
        return await redis.getdel(key);
      } catch {
        return null;
      }
    },
  };
}

let devStore: HandoffStore | null = null;

/** Redis when configured; in-memory only outside production; otherwise none (handoff is refused). */
export function defaultHandoffStore(): HandoffStore | null {
  const creds = getUpstashRestCredentials();
  if (creds) return redisHandoffStore(creds);
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") return null;
  devStore ??= memoryHandoffStore();
  return devStore;
}

export type HandoffStartDeps = {
  getUser(): Promise<{ id: string; email?: string | null } | null>;
  /** A magic-link session is single-factor, so accounts with MFA must sign in on the deployment host. */
  hasVerifiedMfa(): Promise<boolean>;
  createTokenHash(email: string): Promise<string | null>;
  store: HandoffStore | null;
};

export type HandoffStartOutcome =
  /** No session on the custom domain: sign in there first. */
  | { kind: "login"; next: string }
  /** The login cannot be carried over: sign in directly on the deployment host. */
  | { kind: "direct"; next: string; reason: "mfa" | "no_email" | "no_store" | "no_token" }
  | { kind: "handoff"; code: string };

export async function planHandoffStart(deps: HandoffStartDeps, rawNext: string | null): Promise<HandoffStartOutcome> {
  const next = safeInternalPath(rawNext, defaultPostAuthPath());
  const user = await deps.getUser();
  if (!user) return { kind: "login", next };
  if (await deps.hasVerifiedMfa()) return { kind: "direct", next, reason: "mfa" };
  if (!user.email) return { kind: "direct", next, reason: "no_email" };
  if (!deps.store) return { kind: "direct", next, reason: "no_store" };

  const tokenHash = await deps.createTokenHash(user.email);
  if (!tokenHash) return { kind: "direct", next, reason: "no_token" };

  const code = newHandoffCode();
  const stored = await deps.store.put(storageKey(code), { tokenHash, userId: user.id, next }, DOMAIN_HANDOFF_TTL_SEC);
  if (!stored) return { kind: "direct", next, reason: "no_store" };
  return { kind: "handoff", code };
}

export type HandoffCompleteDeps = {
  store: HandoffStore | null;
  /** Creates the session on the current host; returns the signed-in user id. */
  verifyTokenHash(tokenHash: string): Promise<string | null>;
  signOut(): Promise<void>;
};

export type HandoffCompleteOutcome = { kind: "ok"; next: string } | { kind: "failed" };

export async function planHandoffComplete(
  deps: HandoffCompleteDeps,
  rawCode: string | null,
): Promise<HandoffCompleteOutcome> {
  const code = HandoffCodeSchema.safeParse(rawCode);
  if (!code.success || !deps.store) return { kind: "failed" };

  const grant = HandoffGrantSchema.safeParse(await deps.store.take(storageKey(code.data)));
  if (!grant.success) return { kind: "failed" };

  const userId = await deps.verifyTokenHash(grant.data.tokenHash);
  if (!userId) return { kind: "failed" };
  if (userId !== grant.data.userId) {
    await deps.signOut();
    return { kind: "failed" };
  }
  return { kind: "ok", next: safeInternalPath(grant.data.next, defaultPostAuthPath()) };
}
