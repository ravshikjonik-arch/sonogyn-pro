import registryJson from "./international-standards.json";

/**
 * Международный реестр клинических стандартов (см. knowledge-base/INTEGRATION_MODELS.md).
 *
 * Назначение:
 *  - единый словарь организаций / классификаций / статусов для Knowledge-шины;
 *  - фильтры источников для Evidence Assistant (организация, год, статус);
 *  - каталог «Международные стандарты» в кабинете врача.
 *
 * Правило (золотое): каждый чанк знаний обязан нести {organization, document,
 * year, status} из этого реестра — иначе не попадает в продакшен.
 * Копирование текстов организаций запрещено — реестр хранит метаданные и ссылки.
 */

export interface RegistryCategory {
  id: string;
  title: string;
}

export interface RegistryOrganization {
  abbr: string;
  ru?: string;
  name: string;
  url: string;
  guidelines?: string;
  focus: string;
  cats: string[];
  /** 1 — приоритетный источник, 2 — поддерживающий, 3 — справочный */
  tier: 1 | 2 | 3;
  region?: string;
}

export interface RegistryClassification {
  key: string;
  name: string;
  org: string;
  domain: string;
  cats: string[];
  /** Модуль платформы, где классификация уже реализована (если есть) */
  platform_module?: string;
  source?: string;
  status: string;
}

export interface RegistryEvidenceBase {
  name: string;
  purpose: string;
  url: string;
  api: string;
}

export interface InternationalRegistry {
  meta: {
    name: string;
    version: string;
    updated: string;
    purpose: string;
    copyright_note: string;
    schema_version: string;
  };
  categories: RegistryCategory[];
  organizations: RegistryOrganization[];
  classifications: RegistryClassification[];
  evidence_bases: RegistryEvidenceBase[];
  priority_fill_order: string[];
}

export const REGISTRY = registryJson as unknown as InternationalRegistry;

export const registryCategories = (): RegistryCategory[] => REGISTRY.categories;

export const registryOrganizations = (filter?: {
  category?: string;
  tier?: 1 | 2 | 3;
}): RegistryOrganization[] => {
  let list = REGISTRY.organizations;
  const cat = filter?.category;
  const tier = filter?.tier;
  if (cat) list = list.filter((o) => o.cats.includes(cat));
  if (tier) list = list.filter((o) => o.tier === tier);
  return list;
};

export const registryClassifications = (filter?: {
  category?: string;
}): RegistryClassification[] => {
  let list = REGISTRY.classifications;
  const cat = filter?.category;
  if (cat) list = list.filter((c) => c.cats.includes(cat));
  return list;
};

export const registryClassificationByKey = (key: string): RegistryClassification | undefined =>
  REGISTRY.classifications.find((c) => c.key === key);

export const registryOrganizationByAbbr = (abbr: string): RegistryOrganization | undefined =>
  REGISTRY.organizations.find((o) => o.abbr === abbr);

/**
 * Валидация атрибуции чанка знаний против реестра.
 * Возвращает null, если атрибуция допустима; строку с причиной — если нет.
 */
export function validateChunkAttribution(attribution: {
  organization?: string;
  documentStatus?: string;
}): string | null {
  if (!attribution.organization) return "чанк без organization — отклонён (золотое правило)";
  const known = registryOrganizationByAbbr(attribution.organization);
  if (!known && attribution.organization !== "МЗ РФ" && attribution.organization !== "FMF") {
    return `организация «${attribution.organization}» отсутствует в реестре — добавьте её или исправьте атрибуцию`;
  }
  return null;
}
