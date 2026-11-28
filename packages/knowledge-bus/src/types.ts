/**
 * knowledge-bus — Evidence-слой «клинического мозга» SonoGyn Pro (AI_PLATFORM_WIDE_V2.md §2).
 *
 * Мультипаковый retrieval поверх чанков знаний всех нозологий (fmf-chunks, adnexa-pack,
 * breast-pack, thyroid-pack, uterus-pack, ...). Пороги и тактика ДОЛЖНЫ приходить отсюда
 * с атрибуцией {organization, document, year, status} — LLM не «вспоминает» их сама.
 *
 * Пакет самодостаточен: без внешних зависимостей, BM25-Okapi + светлая RU-нормализация.
 * Подключение fmf-chunks (evidence-retrieval) — структурная адаптация через
 * toKnowledgeChunk(): совпадение по форме, без cross-package импорта.
 */

export interface KnowledgeCitation {
  organization: string;
  document: string;
  year: number;
  status: string;
  url?: string;
}

export interface KnowledgeChunk {
  /** Уникальный в пределах шины id (дедупликация). */
  id: string;
  /** Нозологии, к которым относится факт: obstetrics, adnexa, breast, thyroid, uterus... */
  nosology: string[];
  topic: string;
  /** Текст факта собственными формулировками (© — без прямого копирования источника). */
  text: string;
  citation: KnowledgeCitation;
  /** Связанный инструмент из toolRegistry (tool-call). */
  tool?: string;
  /** Красные флаги, которые ассистент обязан озвучить. */
  flags?: string[];
}

export interface KnowledgePack {
  id: string;
  nosology: string;
  description?: string;
  chunks: KnowledgeChunk[];
}

export interface SearchHit {
  chunk: KnowledgeChunk;
  score: number;
}

export interface KnowledgeBusStats {
  packs: number;
  chunks: number;
  byNosology: Record<string, number>;
}

/** Форма FmfKnowledgeChunk (evidence-retrieval) — структурно, без импорта пакета. */
export interface FmfLikeChunk {
  id: string;
  topic: string;
  fact: string;
  nosology: string[];
  tool?: string;
  flags?: string[];
  organization: string;
  document: string;
  year: number;
  status: string;
}

/** Адаптер чанка-подобного FMF формата → KnowledgeChunk. */
export function toKnowledgeChunk(src: FmfLikeChunk): KnowledgeChunk {
  return {
    id: src.id,
    nosology: Array.isArray(src.nosology) ? src.nosology : ["obstetrics"],
    topic: src.topic,
    text: `${src.topic}. ${src.fact}`,
    citation: {
      organization: src.organization,
      document: src.document,
      year: src.year,
      status: src.status,
    },
    tool: src.tool,
    flags: src.flags,
  };
}

/** Адаптер массива FMF-подобных чанков (готовый knowledge-пак для шины). */
export function fmfLikeToPack(id: string, chunks: FmfLikeChunk[], description?: string): KnowledgePack {
  return {
    id,
    nosology: "obstetrics",
    description,
    chunks: chunks.map(toKnowledgeChunk),
  };
}
