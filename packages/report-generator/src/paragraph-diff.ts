export function splitReportParagraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export type ParagraphDiffRow = {
  index: number;
  status: "unchanged" | "changed" | "added" | "removed";
  before?: string;
  after?: string;
};

/** Поблочное сравнение (по абзацам через пустую строку) для UI «что изменил AI». */
export function diffReportParagraphs(before: string, after: string): ParagraphDiffRow[] {
  const a = splitReportParagraphs(before);
  const b = splitReportParagraphs(after);
  const max = Math.max(a.length, b.length);
  const rows: ParagraphDiffRow[] = [];

  for (let i = 0; i < max; i++) {
    const left = a[i];
    const right = b[i];
    if (left === right) {
      rows.push({ index: i, status: "unchanged", before: left, after: right });
    } else if (left && right) {
      rows.push({ index: i, status: "changed", before: left, after: right });
    } else if (left) {
      rows.push({ index: i, status: "removed", before: left });
    } else if (right) {
      rows.push({ index: i, status: "added", after: right });
    }
  }

  return rows.filter((r) => r.status !== "unchanged");
}
