import { getKnowledgeLinksForNosology, type KnowledgeLink } from "@repo/clinical-tools";
import {
  KnowledgeLinkMetaSchema,
  KnowledgeLinkRowSchema,
  type KnowledgeGraphLink,
  type KnowledgeLinkRow,
} from "@repo/types";

export type KnowledgeLinksSource = "db" | "merged" | "code";

function rowHref(row: KnowledgeLinkRow): string | null {
  if (row.to_type === "web_route" || row.to_type === "route") return row.to_id;
  if (row.to_type === "module") return `/tools/refs/${row.to_id.replace(/^education\./, "")}`;
  if (row.to_type === "teaching_case") return `/cases/${row.to_id}`;
  return null;
}

function mapRowToLink(row: KnowledgeLinkRow, codeFallback: KnowledgeLink[]): KnowledgeGraphLink | null {
  const href = rowHref(row);
  if (!href) return null;

  const parsedMeta = row.meta ? KnowledgeLinkMetaSchema.safeParse(row.meta) : null;
  if (parsedMeta?.success) {
    return {
      kind: parsedMeta.data.kind,
      title: parsedMeta.data.title,
      href,
      description: parsedMeta.data.description,
    };
  }

  const fromCode = codeFallback.find((l) => l.href === href);
  if (fromCode) {
    return { kind: fromCode.kind, title: fromCode.title, href, description: fromCode.description };
  }

  return {
    kind: "tool",
    title: href.split("/").filter(Boolean).pop() ?? href,
    href,
  };
}

export function mergeKnowledgeLinks(
  fromType: string,
  fromId: string,
  dbRows: unknown[],
  codeLinks: KnowledgeLink[],
): { links: KnowledgeGraphLink[]; source: KnowledgeLinksSource } {
  const parsedRows: KnowledgeLinkRow[] = [];
  for (const row of dbRows) {
    const parsed = KnowledgeLinkRowSchema.safeParse(row);
    if (parsed.success) parsedRows.push(parsed.data);
  }

  const fromDb: KnowledgeGraphLink[] = [];
  for (const row of parsedRows) {
    const link = mapRowToLink(row, codeLinks);
    if (link) fromDb.push(link);
  }

  if (!fromDb.length) {
    return { links: codeLinks, source: "code" };
  }

  const seen = new Set(fromDb.map((l) => l.href));
  const merged = [...fromDb];
  for (const link of codeLinks) {
    if (!seen.has(link.href)) {
      merged.push(link);
      seen.add(link.href);
    }
  }

  return {
    links: merged,
    source: merged.length > fromDb.length ? "merged" : "db",
  };
}

export function codeFallbackFor(fromType: string, fromId: string): KnowledgeLink[] {
  if (fromType === "nosology") return getKnowledgeLinksForNosology(fromId);
  if (fromType === "teaching_case") {
    return [
      {
        kind: "education",
        title: "Teaching Case Library",
        href: "/tools/refs/case-library",
        description: "Подборки учебных кейсов",
      },
      {
        kind: "education",
        title: "Лента · база знаний",
        href: "/cases?tab=cases&knowledgeBase=1",
      },
    ];
  }
  if (fromType === "module" && fromId === "education.case-library") {
    return [
      {
        kind: "education",
        title: "Кейсы базы знаний",
        href: "/cases?tab=cases&knowledgeBase=1",
      },
    ];
  }
  return [];
}
