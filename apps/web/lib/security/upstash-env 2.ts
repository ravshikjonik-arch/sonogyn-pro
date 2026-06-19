/** Resolve Upstash REST credentials (direct Redis or Vercel KV integration names). */
export function getUpstashRestCredentials(): { url: string; token: string } | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL?.trim() || process.env.KV_REST_API_URL?.trim();
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || process.env.KV_REST_API_TOKEN?.trim();
  if (!url || !token) return null;
  return { url, token };
}

export function isUpstashRestConfigured(): boolean {
  return getUpstashRestCredentials() !== null;
}
