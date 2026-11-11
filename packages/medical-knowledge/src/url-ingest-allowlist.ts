/**
 * Allowlist for admin URL → vault ingest (B1).
 * Only public guideline / NPA hosts. No arbitrary crawl.
 */

export type UrlIngestHostPolicy = {
  host: string;
  /** Shown in license_notes */
  note: string;
  /** If true, quotation_allowed stays false even after editor publish UI defaults */
  nonCommercial?: boolean;
};

/** Exact host or suffix match (e.g. `.who.int`). */
export const URL_INGEST_ALLOWLIST: readonly UrlIngestHostPolicy[] = [
  { host: "endocrincentr.ru", note: "Публичные КР РАЭ / эндокринологический центр" },
  { host: "www.endocrincentr.ru", note: "Публичные КР РАЭ / эндокринологический центр" },
  { host: "iris.who.int", note: "ВОЗ IRIS — проверить CC BY-NC перед RAG", nonCommercial: true },
  { host: "www.who.int", note: "ВОЗ — проверить лицензию страницы", nonCommercial: true },
  { host: "apps.who.int", note: "ВОЗ apps — проверить лицензию", nonCommercial: true },
  { host: "publication.pravo.gov.ru", note: "Официальный публикатор НПА РФ" },
  { host: "pravo.gov.ru", note: "Официальный портал правовой информации РФ" },
  { host: "www.pravo.gov.ru", note: "Официальный портал правовой информации РФ" },
  { host: "medicina.ru", note: "Публикация приказа/методички — проверить права" },
  { host: "www.medicina.ru", note: "Публикация приказа/методички — проверить права" },
  { host: "findresearcher.sdu.dk", note: "Открытый PDF ETA / academic mirror — проверить CC" },
  { host: "etj.bioscientifica.com", note: "European Thyroid Journal — проверить CC BY" },
  { host: "www.bioscientifica.com", note: "Bioscientifica — проверить CC BY" },
  { host: "cr.minzdrav.gov.ru", note: "Рубрикатор КР МЗ РФ" },
  { host: "apicr.minzdrav.gov.ru", note: "API рубрикатора КР МЗ РФ (GetClinrecPdf)" },
  { host: "minzdrav.gov.ru", note: "МЗ РФ — публичные материалы" },
  { host: "www.minzdrav.gov.ru", note: "МЗ РФ — публичные материалы" },
  { host: "static-0.minzdrav.gov.ru", note: "Статика МЗ РФ (PDF КР)" },
] as const;

export type UrlIngestCheck =
  | { ok: true; policy: UrlIngestHostPolicy; normalized: string }
  | { ok: false; reason: string };

export function checkUrlIngestAllowlist(rawUrl: string): UrlIngestCheck {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { ok: false, reason: "Некорректный URL" };
  }
  if (parsed.protocol !== "https:") {
    return { ok: false, reason: "Разрешён только https" };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, reason: "URL с логином/паролем запрещён" };
  }
  const host = parsed.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".local") || /^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    return { ok: false, reason: "Локальные и IP-адреса запрещены" };
  }
  const policy = URL_INGEST_ALLOWLIST.find((p) => {
    const listed = p.host.toLowerCase();
    const apex = listed.replace(/^www\./, "");
    return host === listed || host === apex || host.endsWith(`.${apex}`);
  });
  if (!policy) {
    return {
      ok: false,
      reason: "Домен не в белом списке (только открытые КР/НПА: МЗ, ВОЗ, pravo.gov, РАЭ…)",
    };
  }
  return { ok: true, policy, normalized: parsed.toString() };
}
