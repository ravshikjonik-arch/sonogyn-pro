import chunksJson from "./fmf-chunks.json";
import { registryOrganizationByAbbr } from "./registry";

/**
 * FMF-чанки знаний (изменение №5): факты курса FMF «The 11-13 weeks scan»
 * собственными формулировками, с атрибуцией и статусом документа.
 * Используются RAG-слоем ИИ-ассистентов (sonogyn-chat) и учебным разделом
 * /tools/refs/fmf-11-13. Валидация атрибуции — через международный реестр
 * (золотое правило INTEGRATION_MODELS.md).
 */

export interface FmfKnowledgeChunk {
  id: string;
  topic: string;
  fact: string;
  nosology: string[];
  /** Имя функции-движка, если факт связан с расчётом (tool-call). */
  tool?: string;
  /** Красные флаги, которые ассистент обязан озвучить. */
  flags?: string[];
  /** Атрибуция — одинакова для всех чанков набора. */
  organization: "FMF";
  document: string;
  year: number;
  status: string;
}

interface RawChunk {
  id: string;
  topic: string;
  fact: string;
  nosology: string[];
  tool?: string;
  flags?: string[];
}

const RAW = chunksJson as unknown as {
  meta: {
    name: string;
    source_document: {
      organization: string;
      title: string;
      year: number;
      status: string;
      language: string;
      url: string;
    };
    copyright: string;
    usage: string;
  };
  chunks: RawChunk[];
};

const SRC = RAW.meta.source_document;

export const FMF_SOURCE_DOCUMENT = {
  organization: SRC.organization as "FMF",
  document: SRC.title,
  year: SRC.year,
  status: SRC.status,
  url: SRC.url,
};

export const FMF_KNOWLEDGE_CHUNKS: FmfKnowledgeChunk[] = RAW.chunks.map((c) => ({
  ...c,
  organization: FMF_SOURCE_DOCUMENT.organization,
  document: FMF_SOURCE_DOCUMENT.document,
  year: FMF_SOURCE_DOCUMENT.year,
  status: FMF_SOURCE_DOCUMENT.status,
}));

export const fmfChunkById = (id: string): FmfKnowledgeChunk | undefined =>
  FMF_KNOWLEDGE_CHUNKS.find((c) => c.id === id);

export const fmfChunksByTopic = (topicPrefix: string): FmfKnowledgeChunk[] =>
  FMF_KNOWLEDGE_CHUNKS.filter((c) => c.topic.startsWith(topicPrefix));

/**
 * Ассистент формирует ответ по чанкам — атрибуция обязательна в каждом ответе.
 */
export function fmfAttributionLine(): string {
  return `${FMF_SOURCE_DOCUMENT.organization} «${FMF_SOURCE_DOCUMENT.document}» (${FMF_SOURCE_DOCUMENT.year}, ${FMF_SOURCE_DOCUMENT.status})`;
}

/** Инвариант набора: атрибуция разрешена реестром, tool ссылается на существующий движок. */
export function validateFmfChunks(): string[] {
  const errors: string[] = [];
  const org = registryOrganizationByAbbr("FMF");
  if (!org) errors.push("FMF отсутствует в международном реестре организаций");
  const ids = FMF_KNOWLEDGE_CHUNKS.map((c) => c.id);
  if (new Set(ids).size !== ids.length) errors.push("дубликаты id чанков");
  for (const c of FMF_KNOWLEDGE_CHUNKS) {
    if (c.fact.length < 20) errors.push(`${c.id}: слишком короткий fact`);
    if (!c.nosology.length) errors.push(`${c.id}: нет nosology`);
    if (c.year !== SRC.year) errors.push(`${c.id}: год не совпадает с документом-источником`);
  }
  return errors;
}
