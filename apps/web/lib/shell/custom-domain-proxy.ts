import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isSonogynCustomDomainHost } from "@/lib/shell/custom-domain";

const SKIP_PREFIXES = ["/api/", "/_next/static/", "/_next/image", "/favicon", "/icon", "/manifest.json", "/robots.txt", "/sitemap"];

/** Auth pages: middleware redirects (open access → /home); proxy breaks edge redirect chain. */
const SKIP_EXACT_PATHS = new Set(["/login", "/register", "/verify-phone"]);

/**
 * Emergency-only: custom-domain HTML bootstrap that loads document from *.vercel.app.
 * Default OFF so sonogyn-pro.ru serves real SSR. Re-enable with SONOGYN_CUSTOM_DOMAIN_PROXY=1
 * only if Cloudflare truncates bodies again — prefer fixing CF (DNS-only / body limits) first.
 */
export function isCustomDomainProxyEnabled(): boolean {
  const v = process.env.SONOGYN_CUSTOM_DOMAIN_PROXY?.trim().toLowerCase();
  return v === "1" || v === "true";
}

/** Vercel deployment host (*.vercel.app) — used only when emergency CD proxy is on. */
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
  if (SKIP_EXACT_PATHS.has(pathname)) return false;
  return !SKIP_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
}

function shouldProxyCustomDomainRequest(request: NextRequest): boolean {
  if (!isCustomDomainProxyEnabled()) return false;
  if (process.env.VERCEL !== "1") return false;
  if (!isSonogynCustomDomainHost(request.headers.get("host"))) return false;
  if (request.method !== "GET" && request.method !== "HEAD") return false;

  const pathname = request.nextUrl.pathname;
  if (!shouldProxyPath(pathname)) return false;

  if (request.headers.get("RSC") === "1") return false;

  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("text/html")) return true;
  if (accept.includes("*/*") || accept.trim() === "") return true;
  return false;
}

/**
 * Emergency bootstrap only (SONOGYN_CUSTOM_DOMAIN_PROXY=1).
 * Never navigates the browser to *.vercel.app — stay on sonogyn-pro.ru even on failure.
 */
export function customDomainBootstrapDocument(origin: string): string {
  const upstream = JSON.stringify(origin);
  return `<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>SonoGyn Pro</title></head><body><p style="font-family:sans-serif;padding:24px" id="sg-boot">Загрузка кабинета…</p><script>(function(){var upstream=${upstream};var orig=window.fetch.bind(window);function hdr(h,n){if(!h)return"";try{if(typeof h.get==="function")return h.get(n)||"";}catch(e){}var want=n.toLowerCase();for(var key in h){if(String(key).toLowerCase()===want)return String(h[key]||"");}return"";}function dataRequest(h){var accept=hdr(h,"accept");return hdr(h,"rsc")==="1"||hdr(h,"next-url")!==""||accept.indexOf("text/x-component")>=0;}window.fetch=function(input,init){try{var url=typeof input==="string"?input:(input&&input.url)||"";var headers=(init&&init.headers)||(typeof input!=="string"&&input&&input.headers);if(dataRequest(headers)){var abs=new URL(url,location.origin);if(abs.origin===location.origin){return orig(upstream+abs.pathname+abs.search,Object.assign({},init||{},{credentials:"omit"}));}}}catch(e){}return orig(input,init);};var path=location.pathname+location.search;function fail(msg){var el=document.getElementById("sg-boot");if(el)el.textContent=msg||"Не удалось загрузить кабинет. Обновите страницу.";}orig(upstream+path,{headers:{accept:"text/html"},credentials:"omit"}).then(function(r){if(!r.ok)throw new Error("boot");return r.text();}).then(function(html){document.open();document.write(html);document.close();}).catch(function(){fail();});})();</script></body></html>`;
}

function bootstrapResponse(request: NextRequest, origin: string): NextResponse {
  const html = customDomainBootstrapDocument(origin);
  const headers = new Headers();
  headers.set("content-type", "text/html; charset=utf-8");
  headers.set("cache-control", "private, no-store, no-transform");
  headers.set("x-sonogyn-cd-proxy", "bootstrap");
  return new NextResponse(request.method === "HEAD" ? null : html, { status: 200, headers });
}

/**
 * Default: null → Next.js SSR on sonogyn-pro.ru.
 * Emergency: SONOGYN_CUSTOM_DOMAIN_PROXY=1 serves short bootstrap (no cross-origin navigation).
 */
export async function proxyCustomDomainDocument(request: NextRequest): Promise<NextResponse | null> {
  if (!shouldProxyCustomDomainRequest(request)) return null;

  const origin = resolveDeploymentOrigin();
  if (!origin) return null;

  return bootstrapResponse(request, origin);
}
