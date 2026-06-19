/**
 * IP-адреса ЮKassa для проверки webhook.
 * @see https://yookassa.ru/developers/using-api/webhooks
 */
const YOOKASSA_CIDRS = [
  "185.71.76.0/27",
  "185.71.77.0/27",
  "77.75.153.0/25",
  "77.75.156.11/32",
  "77.75.156.35/32",
  "77.75.154.128/25",
  "2a02:5180::/32",
] as const;

function parseIpv4(ip: string): number[] | null {
  const parts = ip.split(".").map((p) => Number.parseInt(p, 10));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n) || n < 0 || n > 255)) return null;
  return parts;
}

function ipv4InCidr(ip: string, cidr: string): boolean {
  const [network, prefixRaw] = cidr.split("/");
  const prefix = Number.parseInt(prefixRaw ?? "32", 10);
  const ipParts = parseIpv4(ip);
  const netParts = parseIpv4(network ?? "");
  if (!ipParts || !netParts || !Number.isFinite(prefix)) return false;

  const ipNum =
    ((ipParts[0]! << 24) >>> 0) +
    ((ipParts[1]! << 16) >>> 0) +
    ((ipParts[2]! << 8) >>> 0) +
    (ipParts[3]! >>> 0);
  const netNum =
    ((netParts[0]! << 24) >>> 0) +
    ((netParts[1]! << 16) >>> 0) +
    ((netParts[2]! << 8) >>> 0) +
    (netParts[3]! >>> 0);
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return (ipNum & mask) === (netNum & mask);
}

/** Извлекает клиентский IP из заголовков Vercel/proxy. */
export function resolveClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.replace(/^\[|\]$/g, "");
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.replace(/^\[|\]$/g, "");
  return "";
}

export function isYooKassaIp(ip: string): boolean {
  if (!ip) return false;
  if (process.env.YOOKASSA_WEBHOOK_SKIP_IP_CHECK === "true" && process.env.NODE_ENV !== "production") {
    return true;
  }
  if (ip.includes(":")) {
    return YOOKASSA_CIDRS.some((cidr) => cidr.includes(":") && ip.startsWith(cidr.split("/")[0]!.slice(0, 9)));
  }
  return YOOKASSA_CIDRS.filter((c) => !c.includes(":")).some((cidr) => ipv4InCidr(ip, cidr));
}
