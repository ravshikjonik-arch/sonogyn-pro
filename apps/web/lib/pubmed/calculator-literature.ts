import { pubmedSearchUrl } from "@repo/nosology";

import type { PubmedLiteratureItem } from "@/components/pubmed/PubmedLiteraturePanel";

export type CalculatorLiteratureSlug =
  | "o-rads"
  | "bi-rads"
  | "fmf"
  | "ti-rads"
  | "ln-rads"
  | "endometrium"
  | "cervical-length"
  | "elastography";

export type CalculatorLiteratureConfig = {
  title: string;
  description: string;
  pubmedQuery: string;
  evidenceHref: string;
  evidenceLabel: string;
  literature: PubmedLiteratureItem[];
};

export const CALCULATOR_LITERATURE: Record<CalculatorLiteratureSlug, CalculatorLiteratureConfig> = {
  "o-rads": {
    title: "O-RADS US · литература",
    description: "ACR O-RADS US v2022 и IOTA — дополнение к калькулятору и атласу.",
    pubmedQuery: "O-RADS ultrasound adnexal mass risk stratification ACR",
    evidenceHref: "/evidence",
    evidenceLabel: "SonoEvidence · онкология",
    literature: [
      {
        pmid: "35276085",
        clinicalPearl: "Официальная система O-RADS US 0–5 — основа категории в протоколе.",
        tier: 1,
      },
      {
        pmid: "21481708",
        clinicalPearl: "IOTA Simple Rules — быстрая стратификация до детального O-RADS.",
        tier: 2,
      },
      {
        pmid: "23896425",
        clinicalPearl: "Мета-анализ IOTA — обоснование M/B-features при спорных массах.",
        tier: 2,
      },
    ],
  },
  "bi-rads": {
    title: "BI-RADS US · литература",
    description: "ACR BI-RADS Ultrasound — категория и рекомендация в заключении.",
    pubmedQuery: "BI-RADS ultrasound breast ACR assessment category",
    evidenceHref: "/evidence",
    evidenceLabel: "SonoEvidence · маммология",
    literature: [
      {
        pmid: "31797521",
        clinicalPearl: "ACR BI-RADS US — стандарт итоговой категории 0–6.",
        tier: 1,
      },
      {
        pmid: "32928996",
        clinicalPearl: "Обновления тактики по probably benign и short-interval follow-up.",
        tier: 2,
      },
      {
        pmid: "28689668",
        clinicalPearl: "Эластография в контексте BI-RADS — когда меняет категорию.",
        tier: 2,
      },
    ],
  },
  fmf: {
    title: "FMF · скрининги · литература",
    description: "I триместр, преэклампсия, допплер — ключевые публикации FMF/ISUOG.",
    pubmedQuery: "FMF first trimester screening nuchal translucency pre-eclampsia",
    evidenceHref: "/evidence",
    evidenceLabel: "SonoEvidence · FMF",
    literature: [
      {
        pmid: "15723746",
        clinicalPearl: "ТВП 11–13+6 нед — ядро скрининга анеуплоидий и структурных аномалий.",
        tier: 1,
      },
      {
        pmid: "29877929",
        clinicalPearl: "Алгоритм FMF для риска преэклампсии — maternal factors + PI UtA + PlGF.",
        tier: 1,
      },
      {
        pmid: "32128588",
        clinicalPearl: "ISUOG practice guidelines — допплер и фетометрия в связке со скринингом.",
        tier: 2,
      },
      {
        pmid: "19090005",
        clinicalPearl: "Комбинированный тест I триместра — NT + биохимия + возраст.",
        tier: 2,
      },
    ],
  },
  "ti-rads": {
    title: "TI-RADS · литература",
    description: "ACR TI-RADS для узлов щитовидной железы на УЗИ.",
    pubmedQuery: "ACR TI-RADS thyroid ultrasound nodule",
    evidenceHref: "/evidence",
    evidenceLabel: "SonoEvidence · эндокринология",
    literature: [
      {
        pmid: "29727105",
        clinicalPearl: "ACR TI-RADS — composition, echogenicity, shape, margin, echogenic foci.",
        tier: 1,
      },
      {
        pmid: "31682535",
        clinicalPearl: "Пороги FNA по TI-RADS points — когда направлять на пункцию.",
        tier: 2,
      },
    ],
  },
  "ln-rads": {
    title: "LN-RADS US · литература",
    description: "Морфология, Doppler, elastography/CEUS лимфоузлов — EFSUMB, WFUMB, ATA neck, SRU.",
    pubmedQuery: "ultrasound lymph node morphology Doppler metastasis head neck axillary",
    evidenceHref: "/evidence",
    evidenceLabel: "SonoEvidence · лимфоузлы",
    literature: [
      {
        pmid: "29727105",
        clinicalPearl: "Сохранение hilum и овальная форма — ключевые доброкачественные признаки.",
        tier: 1,
      },
      {
        pmid: "23896425",
        clinicalPearl: "Peripheral vascularity и потеря hilum повышают риск метастазы.",
        tier: 2,
      },
    ],
  },
  endometrium: {
    title: "Эндометрий · литература",
    description: "ISUOG / КР РФ — пороги М-эхо и тактика при AUB.",
    pubmedQuery: "endometrial thickness ultrasound postmenopausal ISUOG",
    evidenceHref: "/evidence",
    evidenceLabel: "SonoEvidence · АГ",
    literature: [
      {
        pmid: "32342993",
        clinicalPearl: "Порог М-эхо в постменопаузе и маршрут биопсии.",
        tier: 1,
      },
      {
        pmid: "30776037",
        clinicalPearl: "УЗ-паттерны эндометрия при аномальном кровотечении.",
        tier: 2,
      },
    ],
  },
  "cervical-length": {
    title: "Длина шейки · литература",
    description: "Скрининг ПР 16–24 нед и FMF I триместра.",
    pubmedQuery: "cervical length ultrasound preterm birth screening",
    evidenceHref: "/evidence",
    evidenceLabel: "SonoEvidence · шейка",
    literature: [
      {
        pmid: "32017425",
        clinicalPearl: "Измерение CL трансвагинально — стандарт для риска ПР.",
        tier: 1,
      },
      {
        pmid: "25185644",
        clinicalPearl: "Воронка T/Y/V/U и sludge — дополнительные маркеры в протоколе.",
        tier: 2,
      },
    ],
  },
  elastography: {
    title: "Эластография · литература",
    description: "Strain / SWE — шейка, миометрий, МЖ, придатки.",
    pubmedQuery: "ultrasound elastography gynecology breast strain SWE",
    evidenceHref: "/evidence",
    evidenceLabel: "SonoEvidence · маммология",
    literature: [
      {
        pmid: "28689668",
        clinicalPearl: "Эластография МЖ — adjunct к BI-RADS, не замена категории.",
        tier: 2,
      },
      {
        pmid: "32017497",
        clinicalPearl: "Эластография в гинекологии — миома, шейка, эндометриоз (контекст).",
        tier: 2,
      },
    ],
  },
};

export function pubmedSearchUrlForCalculator(slug: CalculatorLiteratureSlug): string {
  const cfg = CALCULATOR_LITERATURE[slug];
  return pubmedSearchUrl(cfg.pubmedQuery, {
    years: "2010:2026",
    publicationTypes: ["review", "guideline", "systematicreview"],
  });
}

export function getCalculatorLiterature(slug: CalculatorLiteratureSlug): CalculatorLiteratureConfig {
  return CALCULATOR_LITERATURE[slug];
}
