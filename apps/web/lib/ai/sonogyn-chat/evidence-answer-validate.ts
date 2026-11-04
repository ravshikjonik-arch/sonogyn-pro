/**
 * P1 — post-validation for Evidence chat answers.
 * Deterministic; no LLM calls. Fail-soft → rules-safe text.
 */

import type { AssistantAnswer, EvidenceRecord } from "@repo/evidence-retrieval";

import { formatInsufficientEvidenceChatReply } from "./evidence-insufficient";

const PMID_RE = /\bPMID[:\s#]*(\d{5,9})\b/gi;
const DOI_RE = /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/gi;
const URL_RE = /https?:\/\/[^\s)\]>"']+/gi;
const CITE_MARKER_RE = /\[(\d{1,2})\]/g;

export type EvidenceValidationResult = {
  ok: boolean;
  text: string;
  reasons: string[];
  /** True when original narrative was replaced with safe fallback. */
  replaced: boolean;
};

function allowedPmids(citations: EvidenceRecord[]): Set<string> {
  const set = new Set<string>();
  for (const c of citations) {
    const pmid = (c as { pmid?: string | number }).pmid;
    if (pmid != null && String(pmid).trim()) set.add(String(pmid).trim());
    // Also scrape from url/id if PubMed-shaped
    const hay = `${c.id ?? ""} ${c.url ?? ""}`;
    for (const m of hay.matchAll(/pubmed\.ncbi\.nlm\.nih\.gov\/(\d{5,9})/gi)) {
      if (m[1]) set.add(m[1]);
    }
  }
  return set;
}

function allowedUrls(citations: EvidenceRecord[], guidelines: AssistantAnswer["guidelines"]): Set<string> {
  const set = new Set<string>();
  for (const c of citations) {
    if (c.url?.trim()) set.add(c.url.trim().replace(/\/$/, ""));
  }
  for (const g of guidelines) {
    if (g.url?.trim()) set.add(g.url.trim().replace(/\/$/, ""));
  }
  return set;
}

function normalizeUrl(u: string): string {
  try {
    const parsed = new URL(u.replace(/[.,;]+$/, ""));
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return u.replace(/\/$/, "");
  }
}

/**
 * Build a citation-anchored chat reply from structured AssistantAnswer (P2 single-pass).
 * Always includes [n] markers when citations exist.
 */
export function formatEvidenceSourcedChatReply(answer: AssistantAnswer): string {
  if (answer.citations.length === 0 || answer.evidenceStrength === "insufficient") {
    return formatInsufficientEvidenceChatReply(answer);
  }

  const lines: string[] = [
    "## Краткий вывод",
    "",
    answer.summary.trim(),
    "",
    `**Сила доказательств:** ${answer.gradeLabel} (${answer.evidenceStrength})`,
    "",
  ];

  if (answer.recommendations.length > 0) {
    lines.push("## Рекомендации (по источникам)", "");
    for (const r of answer.recommendations) {
      lines.push(`- ${r}`);
    }
    lines.push("");
  }

  if (answer.contraindications.length > 0) {
    lines.push("## Противопоказания / ограничения", "");
    for (const c of answer.contraindications) lines.push(`- ${c}`);
    lines.push("");
  }

  lines.push("## Источники", "");
  answer.citations.slice(0, 12).forEach((c, i) => {
    const n = i + 1;
    lines.push(`[${n}] ${c.title}${c.year ? ` (${c.year})` : ""} — ${c.provider}`);
    if (c.url) lines.push(`    ${c.url}`);
  });

  lines.push("", answer.disclaimers.join(" ") || "_CDS: не является диагнозом; интерпретация — за лечащим врачом._");
  return lines.join("\n");
}

export function postValidateEvidenceAnswer(
  text: string,
  answer: AssistantAnswer,
): EvidenceValidationResult {
  const reasons: string[] = [];
  const trimmed = (text || "").trim();

  if (!trimmed) {
    reasons.push("empty_text");
    return {
      ok: false,
      text: formatEvidenceSourcedChatReply(answer),
      reasons,
      replaced: true,
    };
  }

  if (answer.citations.length === 0 || answer.evidenceStrength === "insufficient") {
    // Narrative must not invent clinical tactics with fake sources.
    const markers = [...trimmed.matchAll(CITE_MARKER_RE)];
    const urls = [...trimmed.matchAll(URL_RE)];
    const pmids = [...trimmed.matchAll(PMID_RE)];
    if (markers.length > 0 || pmids.length > 0) {
      reasons.push("citations_without_retrieval");
      return {
        ok: false,
        text: formatInsufficientEvidenceChatReply(answer),
        reasons,
        replaced: true,
      };
    }
    // Allow insufficient template / summary without cite markers.
    if (urls.length > 0) {
      const allowed = allowedUrls([], answer.guidelines);
      for (const m of urls) {
        const u = normalizeUrl(m[0]!);
        const ok = [...allowed].some((a) => u === normalizeUrl(a) || u.includes("sonogyn") || u.startsWith("/"));
        if (!ok && !u.includes("/tools/")) {
          // relative /tools/ paths in insufficient reply are fine; absolute unknown URLs not
          if (m[0]!.startsWith("http")) {
            reasons.push(`url_not_in_whitelist:${u.slice(0, 80)}`);
          }
        }
      }
      if (reasons.length) {
        return {
          ok: false,
          text: formatInsufficientEvidenceChatReply(answer),
          reasons,
          replaced: true,
        };
      }
    }
    return { ok: true, text: trimmed, reasons, replaced: false };
  }

  const n = Math.min(12, answer.citations.length);
  const markers = [...trimmed.matchAll(CITE_MARKER_RE)].map((m) => Number(m[1]));
  const inRange = markers.filter((i) => i >= 1 && i <= n);
  const hasSourceBlock = /##\s*Источники/i.test(trimmed) || /Источники/i.test(trimmed);
  const whitelistUrls = allowedUrls(answer.citations, answer.guidelines);

  if (inRange.length === 0 && !hasSourceBlock) {
    reasons.push("missing_citation_markers");
  }

  // Out-of-range markers
  for (const i of markers) {
    if (i < 1 || i > n) reasons.push(`cite_out_of_range:${i}`);
  }

  const allowedPmid = allowedPmids(answer.citations);
  for (const m of trimmed.matchAll(PMID_RE)) {
    const id = m[1]!;
    if (allowedPmid.size > 0 && !allowedPmid.has(id)) {
      reasons.push(`invented_pmid:${id}`);
    } else if (allowedPmid.size === 0) {
      // No pmid in retrieval — any PMID in text is invented
      reasons.push(`invented_pmid:${id}`);
    }
  }

  for (const m of trimmed.matchAll(URL_RE)) {
    const u = normalizeUrl(m[0]!);
    const ok = [...whitelistUrls].some((a) => {
      const na = normalizeUrl(a);
      return u === na || u.startsWith(na) || na.startsWith(u);
    });
    if (!ok) reasons.push(`url_not_in_whitelist:${u.slice(0, 80)}`);
  }

  if (reasons.length > 0) {
    return {
      ok: false,
      text: formatEvidenceSourcedChatReply(answer),
      reasons,
      replaced: true,
    };
  }

  return { ok: true, text: trimmed, reasons, replaced: false };
}

/** Whether Evidence chat should skip the second (narrative) LLM — P2 default on. */
export function isEvidenceChatSinglePassEnabled(): boolean {
  const dual = process.env.EVIDENCE_CHAT_DUAL_LLM?.trim();
  if (dual === "1" || dual === "true" || dual === "on") return false;
  return true;
}
