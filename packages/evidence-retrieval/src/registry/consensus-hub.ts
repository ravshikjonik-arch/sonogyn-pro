import {
  REGISTRY,
  type ImplementationStatus,
  type RegistryClassification,
  registryCategories,
  registryClassifications,
  registryOrganizationByAbbr,
} from "./registry";

export type ConsensusHubCard = {
  key: string;
  name: string;
  org: string;
  domain: string;
  cats: string[];
  status: string;
  implementation: ImplementationStatus;
  href?: string;
  roomId?: string;
  source?: string;
};

export const IMPLEMENTATION_LABELS: Record<ImplementationStatus, string> = {
  live: "Калькулятор",
  routed: "Маршрут · учебно",
  corpus: "Полка знаний",
  planned: "В плане",
  external: "Официальный сайт",
};

/** Вывод статуса внедрения, если в JSON не задан явно. */
export function resolveImplementation(cl: RegistryClassification): ImplementationStatus {
  if (cl.implementation) return cl.implementation;
  const pm = cl.platform_module ?? "";
  if (pm.startsWith("/")) return "live";
  if (pm.includes("перспектива")) return "planned";
  if (pm.includes("учеб") || pm.includes("этап 2")) return "routed";
  if (pm.includes("packages/") || pm.includes("Calculator")) return "live";
  return "corpus";
}

/** Каноническая ссылка на инструмент платформы. */
export function resolvePrimaryHref(cl: RegistryClassification): string | undefined {
  if (cl.primary_href?.startsWith("/")) return cl.primary_href;
  const pm = cl.platform_module ?? "";
  if (pm.startsWith("/")) return pm;
  return undefined;
}

export function classificationToHubCard(cl: RegistryClassification): ConsensusHubCard {
  return {
    key: cl.key,
    name: cl.name,
    org: cl.org,
    domain: cl.domain,
    cats: cl.cats,
    status: cl.status,
    implementation: resolveImplementation(cl),
    href: resolvePrimaryHref(cl),
    roomId: cl.room_id,
    source: cl.source,
  };
}

export function buildConsensusHubCards(filter?: { category?: string }): ConsensusHubCard[] {
  return registryClassifications(filter).map(classificationToHubCard);
}

export function consensusHubCategoryLabels(): { id: string; title: string }[] {
  return registryCategories();
}

export function consensusHubOrgLabel(abbr: string): string {
  const o = registryOrganizationByAbbr(abbr);
  if (o?.ru) return `${o.ru} (${abbr})`;
  return abbr;
}

export const CONSENSUS_HUB_META = {
  title: "Международные стандарты",
  description:
    "Единый каталог классификаций и консенсусов: 6 комнат, калькулятор, маршрутизация, полка знаний или план. Не копируем тексты организаций.",
  registryVersion: REGISTRY.meta.version,
  registryUpdated: REGISTRY.meta.updated,
  schemaVersion: REGISTRY.meta.schema_version,
};