import type { Metadata } from "next";
import type { ReactNode } from "react";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sonogyn-pro.ru";

export const metadata: Metadata = {
  title: "SonoGyn Pro — клинический помощник для УЗИ и акушерства-гинекологии",
  description:
    "Калькуляторы O-RADS, IOTA, BI-RADS, TI-RADS, FIGO, 3D-визуализация, клинические рекомендации и кейсы для врачей УЗД и АГ. Не для пациентов.",
  keywords: [
    "УЗИ",
    "акушерство-гинекология",
    "O-RADS",
    "IOTA",
    "BI-RADS",
    "калькулятор",
    "клинические рекомендации",
    "SonoGyn Pro",
  ],
  alternates: {
    canonical: "/landing",
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: `${siteUrl}/landing`,
    siteName: "SonoGyn Pro",
    title: "SonoGyn Pro — клинический помощник для УЗИ и АГ",
    description:
      "Калькуляторы по гайдлайнам, 3D, КР и кейсы в одном рабочем месте для врачей.",
    images: [
      {
        url: `${siteUrl}/clinical-atlas/orads-referat/case-01.png`,
        width: 1200,
        height: 630,
        alt: "SonoGyn Pro — платформа для врачей УЗИ",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "SonoGyn Pro",
      url: siteUrl,
      email: "Sonogyn-pro@mail.ru",
      description:
        "Клиническая платформа поддержки решений для врачей УЗИ и акушерства-гинекологии.",
    },
    {
      "@type": "WebApplication",
      name: "SonoGyn Pro",
      applicationCategory: "HealthApplication",
      operatingSystem: "Web",
      url: `${siteUrl}/landing`,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "RUB",
        description: "Открытый доступ к калькуляторам и справочникам для специалистов",
      },
      audience: {
        "@type": "Audience",
        audienceType: "Healthcare professionals",
      },
    },
  ],
};

/** Лендинг доступен и гостям, и авторизованным (без редиректа в кабинет). */
export default function LandingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
