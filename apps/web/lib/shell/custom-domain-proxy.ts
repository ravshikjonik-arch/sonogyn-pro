import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isSonogynCustomDomainHost } from "@/lib/shell/custom-domain";

const SKIP_PREFIXES = ["/api/", "/_next/static/", "/_next/image", "/favicon", "/icon", "/manifest.json", "/robots.txt", "/sitemap"];

/** Vercel deployment host (*.vercel.app) — полные ответы без обрезки ~20KB на custom domain. */
export function resolveDeploymentOrigin(): string | null {
  const forced =
    process.env.SONOGYN_DEPLOYMENT_ORIGIN?.trim() ||
    process.env.SONOGYN_ASSET_PREFIX?.trim() ||
    process.env.NEXT_PUBLIC_SONOGYN_ASSET_PREFIX?.trim();
  if (forced) return forced.replace(/\/$/, "");

  const raw = process.env.VERCEL_URL?.trim();
  if (raw) {
    const host = raw.replace(/^https?:\/\//, "").split("/")[0]?.toLowerCase() ?? "";
    if (host && !host.endsWith("sonogyn-pro.ru")) return `https://${host}`;
  }

  if (process.env.VERCEL_ENV === "production") {
    return "https://sonogyn-pro-web-ravshan-s-projects3.vercel.app";
  }
  return null;
}

function shouldProxyPath(pathname: string): boolean {
  if (pathname.startsWith("/_next/")) return false;
  return !SKIP_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

function shouldProxyCustomDomainRequest(request: NextRequest): boolean {
  if (process.env.VERCEL !== "1") return false;
  if (!isSonogynCustomDomainHost(request.headers.get("host"))) return false;
  if (request.method !== "GET" && request.method !== "HEAD") return false;

  const pathname = request.nextUrl.pathname;
  if (!shouldProxyPath(pathname)) return false;

  if (request.headers.get("RSC") === "1") return true;

  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("text/html")) return true;
  // curl -I и часть CDN шлют */* или пустой Accept — без прокси HTML снова обрезается.
  if (accept.includes("*/*") || accept.trim() === "") return true;
  return false;
}

const FORWARD_REQUEST_HEADERS = [
  "accept",
  "accept-language",
  "accept-encoding",
  "cookie",
  "rsc",
  "next-router-state-tree",
  "next-router-prefetch",
  "next-url",
  "x-forwarded-for",
] as const;

const STRIP_RESPONSE_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "transfer-encoding",
]);

/**
 * Custom domain (часто Cloudflare proxy) обрезает тело ~16–20KB.
 * Проксируем HTML/RSC на *.vercel.app того же деплоя — браузер остаётся на sonogyn-pro.ru.
 */
export async function proxyCustomDomainDocument(request: NextRequest): Promise<NextResponse | null> {
  if (!shouldProxyCustomDomainRequest(request)) return null;

  const origin = resolveDeploymentOrigin();
  if (!origin) return null;

  const upstreamUrl = new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, origin);
  const headers = new Headers();
  for (const name of FORWARD_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("x-forwarded-host", request.headers.get("host") ?? "sonogyn-pro.ru");
  headers.set("x-middleware-subrequest", "1");

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      redirect: "manual",
      cache: "no-store",
    });
  } catch {
    return null;
  }

  const outHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!STRIP_RESPONSE_HEADERS.has(key.toLowerCase())) outHeaders.set(key, value);
  });
  outHeaders.set("x-sonogyn-cd-proxy", "1");
  outHeaders.set("Cache-Control", "private, no-store, no-transform");

  return new NextResponse(request.method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    headers: outHeaders,
  });
}
