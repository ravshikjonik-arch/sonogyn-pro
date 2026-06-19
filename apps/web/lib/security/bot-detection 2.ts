import type { NextRequest } from "next/server";

/** Webhooks and server-to-server bridges — no browser User-Agent. */
const API_BOT_ALLOWLIST_PREFIXES = ["/api/stripe/webhook", "/api/auth/telegram/bot"] as const;

const CRAWLER_UA_PATTERNS = [
  /bot\b/i,
  /crawler/i,
  /spider/i,
  /scrapy/i,
  /\bcurl\//i,
  /\bwget\b/i,
  /python-requests/i,
  /go-http-client/i,
  /java\/[\d.]+/i,
  /libwww-perl/i,
  /headlesschrome/i,
  /phantomjs/i,
  /semrush/i,
  /ahrefsbot/i,
  /petalbot/i,
  /gptbot/i,
  /claudebot/i,
  /bytespider/i,
  /dataforseo/i,
] as const;

const TRUSTED_CLIENT_UA_PATTERNS = [
  /okhttp/i,
  /cfnetwork/i,
  /darwin/i,
  /expo/i,
  /reactnative/i,
] as const;

function isBotDetectionDisabled(): boolean {
  return process.env.BOT_DETECTION_ENABLED === "false";
}

function isAllowlistedApiPath(pathname: string): boolean {
  return API_BOT_ALLOWLIST_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isTrustedClientUserAgent(userAgent: string): boolean {
  return TRUSTED_CLIENT_UA_PATTERNS.some((pattern) => pattern.test(userAgent));
}

function isSuspiciousUserAgent(userAgent: string): boolean {
  if (!userAgent.trim()) return true;
  if (isTrustedClientUserAgent(userAgent)) return false;
  if (/mozilla\/5\.0/i.test(userAgent) && !CRAWLER_UA_PATTERNS.some((p) => p.test(userAgent))) {
    return false;
  }
  return CRAWLER_UA_PATTERNS.some((pattern) => pattern.test(userAgent));
}

/** Block known crawlers/scrapers on JSON API (PHI scraping mitigation). */
export function shouldBlockSuspiciousApiBot(request: NextRequest): boolean {
  if (isBotDetectionDisabled()) return false;
  const pathname = request.nextUrl.pathname;
  if (!pathname.startsWith("/api/")) return false;
  if (isAllowlistedApiPath(pathname)) return false;

  const userAgent = request.headers.get("user-agent") ?? "";
  return isSuspiciousUserAgent(userAgent);
}
