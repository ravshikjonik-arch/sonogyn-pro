import { getUpstashRestCredentials } from "@/lib/security/upstash-env";
import { timingSafeEqual } from "@/lib/security/timing-safe";

import {
  hashContactIdentifier,
  hashVerificationCode,
  verificationPepper,
} from "./code-generator";
import type { StoredVerificationRecord, VerificationMethod, VerificationPurpose } from "./types";

const CODE_TTL_SEC = 600; // 10 мин — sms.ru иногда доставляет код с задержкой 5–7+ мин
const IDEMPOTENCY_TTL_SEC = 60;

type MemoryEntry = { record: StoredVerificationRecord; expiresAt: number };
const memoryCodes = new Map<string, MemoryEntry>();
const memoryIdempotency = new Map<string, { expiresAt: number; fingerprint: string }>();

function codeKey(purpose: VerificationPurpose, contactHash: string): string {
  return `sonogyn:verify:code:${purpose}:${contactHash}`;
}

function idempotencyKey(key: string): string {
  return `sonogyn:verify:idempotency:${key}`;
}

function getRedisClient(): InstanceType<typeof import("@upstash/redis").Redis> | null {
  const creds = getUpstashRestCredentials();
  if (!creds) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis");
    return new Redis({ url: creds.url, token: creds.token });
  } catch {
    return null;
  }
}

/** Upstash auto-deserializes JSON on get; legacy entries may still be plain strings. */
function parseStoredVerificationRecord(raw: unknown): StoredVerificationRecord | null {
  if (typeof raw === "string") {
    try {
      return parseStoredVerificationRecord(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  if (!raw || typeof raw !== "object") return null;

  const rec = raw as Record<string, unknown>;
  if (typeof rec.codeHash !== "string") return null;
  if (typeof rec.purpose !== "string") return null;
  if (typeof rec.method !== "string") return null;
  if (typeof rec.createdAt !== "number") return null;
  if (typeof rec.attempts !== "number") return null;

  return {
    codeHash: rec.codeHash,
    purpose: rec.purpose as VerificationPurpose,
    method: rec.method as VerificationMethod,
    createdAt: rec.createdAt,
    attempts: rec.attempts,
  };
}

/**
 * Хранение кодов в @vercel/kv / Upstash Redis.
 * Vercel: in-memory Map умрёт при cold start и не шарится между инстансами — только Redis/KV.
 *
 * Env (Vercel KV integration автоматически прокидывает):
 * - KV_REST_API_URL + KV_REST_API_TOKEN
 * или UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 */
export async function storeVerificationCode(params: {
  purpose: VerificationPurpose;
  contact: string;
  method: VerificationMethod;
  code: string;
}): Promise<void> {
  const contactHash = hashContactIdentifier(params.contact);
  const record: StoredVerificationRecord = {
    codeHash: hashVerificationCode(params.code, verificationPepper()),
    purpose: params.purpose,
    method: params.method,
    createdAt: Date.now(),
    attempts: 0,
  };

  const redis = getRedisClient();
  const key = codeKey(params.purpose, contactHash);

  if (redis) {
    // Upstash auto-serializes objects; parseStoredVerificationRecord accepts object or legacy string.
    await redis.set(key, record, { ex: CODE_TTL_SEC });
    return;
  }

  // Dev fallback — НЕ для production multi-instance
  memoryCodes.set(key, { record, expiresAt: Date.now() + CODE_TTL_SEC * 1000 });
}

export async function verifyStoredCode(params: {
  purpose: VerificationPurpose;
  contact: string;
  code: string;
  maxAttempts?: number;
}): Promise<boolean> {
  const maxAttempts = params.maxAttempts ?? 5;
  const contactHash = hashContactIdentifier(params.contact);
  const key = codeKey(params.purpose, contactHash);
  const codeHash = hashVerificationCode(params.code.trim(), verificationPepper());

  const redis = getRedisClient();

  if (redis) {
    const raw = await redis.get(key);
    if (raw == null) return false;
    const record = parseStoredVerificationRecord(raw);
    if (!record) return false;
    if (record.attempts >= maxAttempts) {
      await redis.del(key);
      return false;
    }
    const ok = timingSafeEqual(record.codeHash, codeHash);
    if (ok) {
      await redis.del(key);
      return true;
    }
    record.attempts += 1;
    const ttl = await redis.ttl(key);
    await redis.set(key, record, { ex: ttl > 0 ? ttl : CODE_TTL_SEC });
    return false;
  }

  const mem = memoryCodes.get(key);
  if (!mem || Date.now() >= mem.expiresAt) {
    memoryCodes.delete(key);
    return false;
  }
  if (mem.record.attempts >= maxAttempts) {
    memoryCodes.delete(key);
    return false;
  }
  const ok = timingSafeEqual(mem.record.codeHash, codeHash);
  if (ok) {
    memoryCodes.delete(key);
    return true;
  }
  mem.record.attempts += 1;
  return false;
}

/** Idempotency: повторный POST с тем же ключом в течение 60с не шлёт второй код. */
export async function checkIdempotency(
  idempotencyKeyHeader: string | null,
  fingerprint: string,
): Promise<"new" | "duplicate"> {
  const key = idempotencyKeyHeader?.trim() || fingerprint;
  const redis = getRedisClient();
  const redisKey = idempotencyKey(key);

  if (redis) {
    const inserted = await redis.set(redisKey, fingerprint, { nx: true, ex: IDEMPOTENCY_TTL_SEC });
    return inserted === "OK" ? "new" : "duplicate";
  }

  const now = Date.now();
  const existing = memoryIdempotency.get(redisKey);
  if (existing && now < existing.expiresAt && existing.fingerprint === fingerprint) {
    return "duplicate";
  }
  memoryIdempotency.set(redisKey, { fingerprint, expiresAt: now + IDEMPOTENCY_TTL_SEC * 1000 });
  return "new";
}

export function buildIdempotencyFingerprint(params: {
  purpose: VerificationPurpose;
  method: VerificationMethod;
  contact: string;
}): string {
  return `${params.purpose}:${params.method}:${hashContactIdentifier(params.contact)}`;
}
