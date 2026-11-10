import {
  expandVaultQueryForEmbedding,
  expandVaultQueryVariants,
  mergeVaultHitsRrf,
  type MedicalVaultSearchHit,
} from "@repo/evidence-retrieval";

import { createServiceRoleClient } from "@/utils/supabase/admin";

type EmbeddingResponse = {
  data?: Array<{ embedding?: number[] }>;
  error?: { message?: string };
};

function embeddingApi(): { url: string; key: string; model: string } | null {
  const openrouter = process.env.OPENROUTER_API_KEY?.trim();
  if (openrouter) {
    return {
      url: (process.env.OPENROUTER_API_URL?.trim() || "https://openrouter.ai/api/v1").replace(
        /\/chat\/completions$/,
        "",
      ).replace(/\/$/, "") + "/embeddings",
      key: openrouter,
      model: process.env.OPENROUTER_EMBEDDING_MODEL?.trim() || "openai/text-embedding-3-small",
    };
  }
  const openai = process.env.OPENAI_API_KEY?.trim();
  if (openai) {
    return {
      url: "https://api.openai.com/v1/embeddings",
      key: openai,
      model: process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small",
    };
  }
  return null;
}

export async function embedQueryText(text: string): Promise<number[] | null> {
  const api = embeddingApi();
  if (!api) return null;

  const res = await fetch(api.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${api.key}`,
      "Content-Type": "application/json",
      ...(api.url.includes("openrouter")
        ? {
            "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://sonogyn.pro",
            "X-Title": "SonoGyn Pro Evidence Vault",
          }
        : {}),
    },
    body: JSON.stringify({
      model: api.model,
      input: text.slice(0, 8000),
    }),
  });

  if (!res.ok) return null;
  const json = (await res.json()) as EmbeddingResponse;
  const vector = json.data?.[0]?.embedding;
  if (!Array.isArray(vector) || vector.length !== 1536) return null;
  return vector;
}

function mapVaultRows(data: unknown[]): MedicalVaultSearchHit[] {
  return data.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      chunkId: String(r.chunk_id),
      sourceId: String(r.source_id),
      title: String(r.title ?? "Vault source"),
      organization: r.organization ? String(r.organization) : undefined,
      year: typeof r.year === "number" ? r.year : undefined,
      section: r.section_title ? String(r.section_title) : undefined,
      quote: String(r.quote ?? "").slice(0, 480),
      url: r.external_url ? String(r.external_url) : "#",
      score: typeof r.similarity === "number" ? r.similarity : 0,
      pageStart: typeof r.page_start === "number" ? r.page_start : undefined,
      pageEnd: typeof r.page_end === "number" ? r.page_end : undefined,
    };
  });
}

/** Merge semantic + FTS by Reciprocal Rank Fusion (raw scores are not comparable). */
export function mergeVaultHits(
  a: MedicalVaultSearchHit[],
  b: MedicalVaultSearchHit[],
  limit: number,
): MedicalVaultSearchHit[] {
  return mergeVaultHitsRrf(a, b, limit);
}

function isVaultFtsEnabled(): boolean {
  return Boolean(process.env.EVIDENCE_MEDICAL_VAULT_FTS?.trim().match(/^(1|true|on)$/i));
}

async function searchMedicalVaultFts(args: {
  query: string;
  limit: number;
}): Promise<MedicalVaultSearchHit[]> {
  if (!isVaultFtsEnabled()) return [];
  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch {
    return [];
  }
  const matchCount = Math.min(Math.max(args.limit, 1), 12);
  const variants = expandVaultQueryVariants(args.query);
  const lists: MedicalVaultSearchHit[][] = [];

  for (const queryText of variants) {
    const params = { query_text: queryText, match_count: matchCount };
    const ru = await supabase.rpc("match_medical_vault_chunks_fts_ru", params);
    if (!ru.error && Array.isArray(ru.data)) {
      lists.push(mapVaultRows(ru.data));
      continue;
    }
    const legacy = await supabase.rpc("match_medical_vault_chunks_fts", params);
    if (!legacy.error && Array.isArray(legacy.data)) {
      lists.push(mapVaultRows(legacy.data));
    }
  }

  if (lists.length === 0) return [];
  if (lists.length === 1) return lists[0]!.slice(0, matchCount);
  return lists.reduce((acc, list) => mergeVaultHitsRrf(acc, list, matchCount), [] as MedicalVaultSearchHit[]);
}

/**
 * Server-side vault semantic (+ optional FTS) search. Requires:
 * - OPENROUTER_API_KEY or OPENAI_API_KEY
 * - SUPABASE_SERVICE_ROLE_KEY
 * - migration match_medical_vault_chunks applied
 * - EVIDENCE_MEDICAL_VAULT=1 (feature flag)
 * - EVIDENCE_MEDICAL_VAULT_FTS=1 after FTS migration GO (optional)
 */
export async function searchMedicalVault(args: {
  query: string;
  limit: number;
}): Promise<MedicalVaultSearchHit[]> {
  if (!process.env.EVIDENCE_MEDICAL_VAULT?.trim().match(/^(1|true|on)$/i)) {
    return [];
  }

  const limit = Math.min(Math.max(args.limit, 1), 12);
  const embedding = await embedQueryText(expandVaultQueryForEmbedding(args.query));

  let semantic: MedicalVaultSearchHit[] = [];
  if (embedding) {
    let supabase;
    try {
      supabase = createServiceRoleClient();
    } catch {
      supabase = null;
    }
    if (supabase) {
      const { data, error } = await supabase.rpc("match_medical_vault_chunks", {
        query_embedding: embedding,
        match_count: limit,
        match_threshold:
          Number.parseFloat(process.env.EVIDENCE_VAULT_MATCH_THRESHOLD ?? "0.72") || 0.72,
      });
      if (!error && Array.isArray(data)) semantic = mapVaultRows(data);
    }
  }

  const fts = await searchMedicalVaultFts({ query: args.query, limit });
  if (semantic.length === 0 && fts.length === 0) return [];
  if (fts.length === 0) return semantic.slice(0, limit);
  if (semantic.length === 0) return fts.slice(0, limit);
  return mergeVaultHits(semantic, fts, limit);
}

export type MedicalVaultStatusReason =
  | "disabled"
  | "no_embed_key"
  | "ready";

/** Ops/UI: why vault semantic channel is on or off (no secrets). */
export type MedicalVaultStatus = {
  /** Wired into Evidence retrieval config */
  enabled: boolean;
  flag: boolean;
  hasEmbedApi: boolean;
  ftsFlag: boolean;
  reason: MedicalVaultStatusReason;
  detail: string;
  runbook: string;
};

export function getMedicalVaultStatus(): MedicalVaultStatus {
  const flag = Boolean(process.env.EVIDENCE_MEDICAL_VAULT?.trim().match(/^(1|true|on)$/i));
  const ftsFlag = isVaultFtsEnabled();
  const hasEmbedApi = Boolean(embeddingApi());
  const runbook = "docs/ops/MEDICAL_VAULT_EMBED_RUNBOOK.md";
  if (!flag) {
    return {
      enabled: false,
      flag: false,
      hasEmbedApi,
      ftsFlag,
      reason: "disabled",
      detail: "EVIDENCE_MEDICAL_VAULT unset/off — semantic vault не в цепочке Evidence",
      runbook,
    };
  }
  if (!hasEmbedApi) {
    return {
      enabled: false,
      flag: true,
      hasEmbedApi: false,
      ftsFlag,
      reason: "no_embed_key",
      detail: "Флаг включён, но нет OPENROUTER_API_KEY / OPENAI_API_KEY для embeddings",
      runbook,
    };
  }
  return {
    enabled: true,
    flag: true,
    hasEmbedApi: true,
    ftsFlag,
    reason: "ready",
    detail: ftsFlag
      ? "Vault semantic+FTS wired (нужны applied migrations + embedded published chunks)"
      : "Vault search wired (нужны applied migration + embedded published chunks); FTS off",
    runbook,
  };
}

export function isMedicalVaultEnabled(): boolean {
  return getMedicalVaultStatus().enabled;
}
