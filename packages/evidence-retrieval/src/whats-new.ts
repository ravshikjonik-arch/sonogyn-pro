import type { EvidenceRecord } from "./types.js";
import { buildEvidenceRecord } from "./normalizer.js";
import { grlsSearchUrl } from "./adapters/grls.adapter.js";

export type WhatsNewItem = {
  id: string;
  category: "guideline" | "research" | "safety" | "drugs";
  title: string;
  summary: string;
  url: string;
  updatedAt: string;
};

/**
 * Curated «Новое» feed for OB/GYN/US — metadata + links only.
 * Later: diff of KR sync + Roszdravnadzor crawl.
 */
export function listWhatsNewFeed(now = new Date()): WhatsNewItem[] {
  const iso = now.toISOString().slice(0, 10);
  return [
    {
      id: `kr-rubricator-${iso}`,
      category: "guideline",
      title: "Рубрикатор КР МЗ РФ — проверить обновления по АГ",
      summary:
        "Сверьте карточки акушерства и гинекологии в кабинете с официальным рубрикатором. При расхождении приоритет у опубликованной КР.",
      url: "https://cr.minzdrav.gov.ru/",
      updatedAt: iso,
    },
    {
      id: `rz-quality-${iso}`,
      category: "safety",
      title: "Росздравнадзор — контроль качества ЛС и ИМН",
      summary: "Лента уведомлений о сериях препаратов и изделий (в т.ч. для стационара).",
      url: "https://www.roszdravnadzor.gov.ru/drugs/qualitycontrol",
      updatedAt: iso,
    },
    {
      id: `pubmed-obgyn-${iso}`,
      category: "research",
      title: "Новые публикации · obstetrics OR gynecology OR ultrasound",
      summary: "Свежие записи PubMed по акушерству, гинекологии и УЗИ (откройте фильтр по дате).",
      url: "https://pubmed.ncbi.nlm.nih.gov/?term=%28obstetrics%5BTitle%2FAbstract%5D+OR+gynecology%5BTitle%2FAbstract%5D+OR+ultrasound%5BTitle%2FAbstract%5D%29&sort=date",
      updatedAt: iso,
    },
    {
      id: `ctgov-obgyn-${iso}`,
      category: "research",
      title: "ClinicalTrials.gov — активные исследования АГ",
      summary: "Рекрутирующие и активные испытания по женскому здоровью.",
      url: "https://clinicaltrials.gov/search?cond=Pregnancy&aggFilters=status:rec%20act",
      updatedAt: iso,
    },
    {
      id: `grls-check-${iso}`,
      category: "drugs",
      title: "ГРЛС — сверка инструкций по МНН",
      summary: "Перед назначением беременным откройте актуальный статус препарата в реестре.",
      url: grlsSearchUrl("беременность"),
      updatedAt: iso,
    },
  ];
}

export function whatsNewAsEvidenceRecords(now = new Date()): EvidenceRecord[] {
  return listWhatsNewFeed(now).map((item, index) =>
    buildEvidenceRecord({
      provider: item.category === "drugs" ? "grls" : item.category === "safety" ? "roszdravnadzor" : "kr_mz_rf",
      sourceId: item.id,
      title: item.title,
      abstract: item.summary,
      url: item.url,
      recordType: item.category === "guideline" ? "guideline" : item.category === "drugs" ? "drug_label" : "other",
      language: "ru",
      relevanceScore: 0.9 - index * 0.05,
      section: item.category,
    }),
  );
}
