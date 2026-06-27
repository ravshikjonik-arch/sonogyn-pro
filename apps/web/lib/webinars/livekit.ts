import { AccessToken } from "livekit-server-sdk";

export type LiveKitConfig = {
  url: string;
  apiKey: string;
  apiSecret: string;
};

export function getLiveKitConfig(): LiveKitConfig | null {
  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL?.trim();
  const apiKey = process.env.LIVEKIT_API_KEY?.trim();
  const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();
  if (!url || !apiKey || !apiSecret) return null;
  return { url, apiKey, apiSecret };
}

export function isLiveKitConfigured(): boolean {
  return getLiveKitConfig() !== null;
}

export function createLiveKitRoomName(lessonId: string): string {
  return `sg-webinar-${lessonId.replace(/-/g, "").slice(0, 24)}`;
}

export async function mintLiveKitToken(params: {
  roomName: string;
  identity: string;
  displayName: string;
  canPublish: boolean;
  ttlSec?: number;
}): Promise<string> {
  const cfg = getLiveKitConfig();
  if (!cfg) throw new Error("LiveKit не настроен (LIVEKIT_API_KEY / LIVEKIT_API_SECRET / NEXT_PUBLIC_LIVEKIT_URL).");

  const token = new AccessToken(cfg.apiKey, cfg.apiSecret, {
    identity: params.identity,
    name: params.displayName,
    ttl: params.ttlSec ?? 3 * 60 * 60,
  });

  token.addGrant({
    roomJoin: true,
    room: params.roomName,
    canPublish: params.canPublish,
    canSubscribe: true,
    canPublishData: true,
  });

  return token.toJwt();
}
