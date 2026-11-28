/**
 * KnowledgeBus — единая шина знаний «клинического мозга»: мультипаковый поиск
 * с дедупликацией по id, фильтром по нозологии/инструменту и цитатой в каждом хите.
 */
import { Bm25Index } from "./bm25.js";
import type { KnowledgeBusStats, KnowledgeChunk, KnowledgePack, SearchHit } from "./types.js";

export interface BusSearchOptions {
  /** Ограничить нозологией (одной из chunk.nosology). */
  nosology?: string;
  /** Только чанки, привязанные к инструменту/движку. */
  tool?: string;
  /** Максимум хитов (по умолчанию 5). */
  topK?: number;
}

interface BusState {
  chunks: KnowledgeChunk[];
  index: Bm25Index;
}

export class KnowledgeBus {
  private packs = new Map<string, KnowledgePack>();
  private state: BusState = { chunks: [], index: new Bm25Index([]) };

  /** Регистрация (или замена) knowledge-пака нозологии. */
  registerPack(pack: KnowledgePack): void {
    this.packs.set(pack.id, pack);
    this.rebuild();
  }

  removePack(packId: string): boolean {
    const removed = this.packs.delete(packId);
    if (removed) this.rebuild();
    return removed;
  }

  private rebuild(): void {
    const seen = new Set<string>();
    const chunks: KnowledgeChunk[] = [];
    for (const pack of this.packs.values()) {
      for (const chunk of pack.chunks) {
        if (seen.has(chunk.id)) continue;
        seen.add(chunk.id);
        chunks.push(chunk);
      }
    }
    this.state = { chunks, index: new Bm25Index(chunks.map((c) => `${c.topic}. ${c.text}`)) };
  }

  /** Поиск по всей шине: хиты с цитатами {organization, document, year, status}. */
  search(query: string, opts: BusSearchOptions = {}): SearchHit[] {
    const topK = opts.topK ?? 5;
    const matches = this.state.index.search(query, topK * 3);
    const hits: SearchHit[] = [];
    for (const m of matches) {
      const chunk = this.state.chunks[m.index];
      if (!chunk) continue;
      if (opts.nosology && !chunk.nosology.includes(opts.nosology)) continue;
      if (opts.tool && chunk.tool !== opts.tool) continue;
      hits.push({ chunk, score: m.score });
      if (hits.length >= topK) break;
    }
    return hits;
  }

  /** Все чанки нозологии (для чеклистов/офлайн-паков). */
  byNosology(nosology: string): KnowledgeChunk[] {
    return this.state.chunks.filter((c) => c.nosology.includes(nosology));
  }

  /** Чанки конкретного инструмента (для подсказок рядом с калькулятором). */
  byTool(tool: string): KnowledgeChunk[] {
    return this.state.chunks.filter((c) => c.tool === tool);
  }

  stats(): KnowledgeBusStats {
    const byNosology: Record<string, number> = {};
    for (const c of this.state.chunks) {
      for (const n of c.nosology) byNosology[n] = (byNosology[n] ?? 0) + 1;
    }
    return { packs: this.packs.size, chunks: this.state.chunks.length, byNosology };
  }
}
