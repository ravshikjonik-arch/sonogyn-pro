/**
 * Simple section-aware chunker for editor text ingest (P1-1).
 * Not a replacement for Docling PDF layout — plain text / markdown only.
 */

export type PlainTextChunk = {
  chunkIndex: number;
  sectionTitle: string | null;
  content: string;
};

const MAX_CHUNK_CHARS = 1800;
const HEADING_RE = /^(#{1,3}\s+.+|[А-ЯA-Z0-9][^\n]{0,80}:)\s*$/m;

export function chunkPlainText(raw: string): PlainTextChunk[] {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const blocks = normalized.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const out: PlainTextChunk[] = [];
  let buf = "";
  let section: string | null = null;

  const flush = () => {
    const content = buf.trim();
    if (!content) return;
    out.push({ chunkIndex: out.length, sectionTitle: section, content });
    buf = "";
  };

  for (const block of blocks) {
    const heading = HEADING_RE.test(block.split("\n")[0] ?? "") ? block.split("\n")[0]!.replace(/^#+\s*/, "").trim() : null;
    if (heading && block.length < 120) {
      flush();
      section = heading.replace(/:$/, "");
      continue;
    }
    if (buf.length + block.length + 2 > MAX_CHUNK_CHARS) {
      flush();
    }
    buf = buf ? `${buf}\n\n${block}` : block;
  }
  flush();
  return out;
}
