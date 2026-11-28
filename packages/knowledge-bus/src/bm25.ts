/**
 * BM25-Okapi над чанками знаний. Светлая RU-нормализация: lowercase, ё→е,
 * токены [a-zа-яё0-9]+ длиной ≥2. Без внешних зависимостей — работает на устройстве.
 */

export function tokenize(text: string): string[] {
  return (text.toLowerCase().replace(/ё/g, "е").match(/[a-zа-я0-9]+/g) ?? []).filter(
    (t) => t.length >= 2,
  );
}

interface IndexedDoc {
  tf: Map<string, number>;
  len: number;
}

export interface Bm25Match {
  index: number;
  score: number;
}

export class Bm25Index {
  private docs: IndexedDoc[] = [];
  private df = new Map<string, number>();
  private avgLen = 0;
  private readonly k1: number;
  private readonly b: number;

  constructor(texts: string[], k1 = 1.5, b = 0.75) {
    this.k1 = k1;
    this.b = b;
    for (const text of texts) {
      const tokens = tokenize(text);
      const tf = new Map<string, number>();
      for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
      this.docs.push({ tf, len: tokens.length });
      for (const t of tf.keys()) this.df.set(t, (this.df.get(t) ?? 0) + 1);
    }
    this.avgLen = this.docs.length > 0 ? this.docs.reduce((a, d) => a + d.len, 0) / this.docs.length : 0;
  }

  get size(): number {
    return this.docs.length;
  }

  /** BM25-оценка запроса против документа i (Okapi). */
  scoreDoc(query: string, i: number): number {
    const doc = this.docs[i];
    if (!doc) return 0;
    const q = tokenize(query);
    if (q.length === 0 || doc.len === 0 || this.avgLen === 0) return 0;
    const n = this.docs.length;
    let s = 0;
    for (const term of q) {
      const dft = this.df.get(term);
      if (!dft) continue;
      const idf = Math.log(1 + (n - dft + 0.5) / (dft + 0.5));
      const tf = doc.tf.get(term) ?? 0;
      if (tf === 0) continue;
      const norm = tf * (this.k1 + 1) / (tf + this.k1 * (1 - this.b + this.b * (doc.len / this.avgLen)));
      s += idf * norm;
    }
    return s;
  }

  /** Поиск: топ topK документов с score > 0, по убыванию. */
  search(query: string, topK = 5): Bm25Match[] {
    const matches: Bm25Match[] = [];
    for (let i = 0; i < this.docs.length; i++) {
      const score = this.scoreDoc(query, i);
      if (score > 0) matches.push({ index: i, score });
    }
    matches.sort((a, b2) => b2.score - a.score);
    return matches.slice(0, topK);
  }
}
