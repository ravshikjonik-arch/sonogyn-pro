import type { Metadata } from "next";

import { CDS_DISCLAIMER_RU } from "@/lib/config/platform";

const DEFAULT_SITE_URL = "https://sonogyn-pro.ru";

export function resolvePublicSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_SITE_URL).replace(/\/$/, "");
}

export type PublicMetadataInput = {
  /** Заголовок вкладки (без суффикса — template в root layout добавит «| SonoGyn Pro»). */
  title: string;
  description: string;
  /** Canonical path, напр. `/tools/calc/rads/o-rads` */
  path: string;
  keywords?: string[];
};

/** Единый OG/canonical для публичных и полу-публичных инструментов (ru). */
export function buildPublicMetadata(input: PublicMetadataInput): Metadata {
  const url = `${resolvePublicSiteUrl()}${input.path}`;
  const description = input.description.includes("CDS")
    ? input.description
    : `${input.description} ${CDS_DISCLAIMER_RU}`;

  return {
    title: input.title,
    description,
    keywords: input.keywords,
    alternates: { canonical: input.path },
    openGraph: {
      type: "website",
      locale: "ru_RU",
      url,
      siteName: "SonoGyn Pro",
      title: input.title,
      description,
    },
    twitter: {
      card: "summary",
      title: input.title,
      description,
    },
    robots: { index: true, follow: true },
  };
}
