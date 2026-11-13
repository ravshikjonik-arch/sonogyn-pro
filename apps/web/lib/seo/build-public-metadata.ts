import type { Metadata } from "next";

import { CDS_DISCLAIMER_RU } from "@/lib/config/platform";

const DEFAULT_SITE_URL = "https://sonogyn-pro.ru";
export const DEFAULT_OG_IMAGE_PATH = "/og-default.png";

const TITLE_MAX = 60;
const DESCRIPTION_MAX = 155;

export function resolvePublicSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_SITE_URL).replace(/\/$/, "");
}

/** Убирает хвост бренда, чтобы root template `%s | SonoGyn Pro` не дублировал. */
export function stripTrailingBrand(title: string): string {
  return title
    .replace(/\s*[·|—\-]\s*SonoGyn Pro\s*$/i, "")
    .replace(/\s+SonoGyn Pro\s*$/i, "")
    .trim();
}

/** Обрезка по границе слова (для title/description в выдаче). */
export function truncateAtWord(text: string, max: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  const slice = normalized.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace >= Math.floor(max * 0.55) ? slice.slice(0, lastSpace) : slice;
  return cut.trimEnd();
}

export type PublicMetadataInput = {
  /** Заголовок вкладки (без суффикса — template в root layout добавит «| SonoGyn Pro»). */
  title: string;
  description: string;
  /** Canonical path, напр. `/tools/calc/rads/o-rads` или `/` */
  path: string;
  keywords?: string[];
  /** Приватные маршруты — не индексировать */
  noindex?: boolean;
  /** Не дописывать CDS-дисклеймер к description */
  skipCdsDisclaimer?: boolean;
  /** Переопределить OG image path (относительно site) */
  ogImagePath?: string;
};

function absoluteUrl(path: string): string {
  const base = resolvePublicSiteUrl();
  if (!path || path === "/") return `${base}/`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Единый OG/canonical для публичных и полу-публичных инструментов (ru). */
export function buildPublicMetadata(input: PublicMetadataInput): Metadata {
  const title = truncateAtWord(stripTrailingBrand(input.title), TITLE_MAX);
  const rawDescription = input.skipCdsDisclaimer
    ? input.description
    : input.description.includes("CDS")
      ? input.description
      : `${input.description} ${CDS_DISCLAIMER_RU}`;
  const description = truncateAtWord(rawDescription, DESCRIPTION_MAX);
  const canonicalPath = input.path.startsWith("/") ? input.path : `/${input.path}`;
  const url = absoluteUrl(canonicalPath === "/" ? "/" : canonicalPath);
  const ogImage = absoluteUrl(input.ogImagePath ?? DEFAULT_OG_IMAGE_PATH);
  const robots = input.noindex
    ? { index: false, follow: false }
    : { index: true, follow: true };

  return {
    title,
    description,
    keywords: input.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      url,
      siteName: "SonoGyn Pro",
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: "SonoGyn Pro" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    robots,
  };
}
