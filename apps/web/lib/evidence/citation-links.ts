import { CLINICAL_GUIDELINES } from "@repo/clinical-guidelines";
import type { EvidenceRecord } from "@repo/evidence-retrieval";

function normTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Map retrieval row to in-app КР card when possible. */
export function resolveInternalGuidelineHref(params: {
  title?: string;
  url?: string;
  recordId?: string;
}): string | null {
  const { title, url, recordId } = params;

  if (recordId) {
    const direct = CLINICAL_GUIDELINES.find((g) => g.id === recordId);
    if (direct) return `/tools/refs/guidelines/${direct.id}`;
  }

  if (url) {
    const byUrl = CLINICAL_GUIDELINES.find((g) => g.officialUrl && g.officialUrl === url);
    if (byUrl) return `/tools/refs/guidelines/${byUrl.id}`;
  }

  if (title) {
    const nt = normTitle(title);
    if (!nt) return null;
    const byTitle = CLINICAL_GUIDELINES.find((g) => {
      const gt = normTitle(g.title);
      return gt === nt || gt.includes(nt) || nt.includes(gt);
    });
    if (byTitle) return `/tools/refs/guidelines/${byTitle.id}`;
  }

  return null;
}

export type CitationLink = {
  href: string;
  external: boolean;
  label: string;
};

export function resolveCitationLink(citation: Pick<EvidenceRecord, "id" | "title" | "url">): CitationLink {
  const internal = resolveInternalGuidelineHref({
    title: citation.title,
    url: citation.url,
    recordId: citation.id,
  });
  if (internal) {
    return { href: internal, external: false, label: "КР в SonoGyn Pro" };
  }
  return { href: citation.url, external: true, label: "Первоисточник" };
}

export function resolveGuidelineEntryLink(guideline: {
  title: string;
  url: string;
}): CitationLink {
  const internal = resolveInternalGuidelineHref({ title: guideline.title, url: guideline.url });
  if (internal) {
    return { href: internal, external: false, label: "КР в SonoGyn Pro" };
  }
  return { href: guideline.url, external: true, label: "Первоисточник" };
}
