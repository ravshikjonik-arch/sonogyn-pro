import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_TTL_SEC = 3600;

function playbackSecret(): string {
  return (
    process.env.PLAYBACK_TOKEN_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()?.slice(0, 32) ||
    "dev-playback-secret-change-me"
  );
}

export function createPlaybackToken(lessonId: string, userId: string, ttlSec = DEFAULT_TTL_SEC): string {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const payload = `${lessonId}:${userId}:${exp}`;
  const sig = createHmac("sha256", playbackSecret()).update(payload).digest("base64url");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyPlaybackToken(token: string, lessonId: string, userId: string): boolean {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    if (lastColon <= 0) return false;
    const payload = decoded.slice(0, lastColon);
    const sig = decoded.slice(lastColon + 1);
    const expected = createHmac("sha256", playbackSecret()).update(payload).digest("base64url");
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return false;

    const [tokenLessonId, tokenUserId, expRaw] = payload.split(":");
    if (tokenLessonId !== lessonId || tokenUserId !== userId) return false;
    const exp = Number.parseInt(expRaw, 10);
    if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
    return true;
  } catch {
    return false;
  }
}

export async function presignPlaybackUrl(key: string, expiresIn = DEFAULT_TTL_SEC): Promise<string> {
  if (key.startsWith("https://") && key.includes("blob.vercel-storage.com")) {
    const { getDownloadUrl } = await import("@vercel/blob");
    return getDownloadUrl(key, { expiresIn });
  }
  const { presignGetObject } = await import("@/lib/storage/s3");
  return presignGetObject(key, expiresIn);
}
