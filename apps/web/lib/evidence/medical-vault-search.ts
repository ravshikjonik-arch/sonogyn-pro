import type { MedicalVaultSearchHit } from "@repo/evidence-retrieval";

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

/**
 * Server-side vault semantic search. Requires:
 * - OPENROUTER_API_KEY or OPENAI_API_KEY
 * - SUPABASE_SERVICE_ROLE_KEY
 * - migration match_medical_vault_chunks applied
 * - EVIDENCE_MEDICAL_VAULT=1 (feature flag)
 */
export async function searchMedicalVault(args: {
  query: string;
  limit: number;
}): Promise<MedicalVaultSearchHit[]> {
  if (!process.env.EVIDENCE_MEDICAL_VAULT?.trim().match(/^(1|true|on)$/i)) {
    return [];
  }

  const embedding = await embedQueryText(args.query);
  if (!embedding) return [];

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch {
    return [];
  }

  const { data, error } = await supabase.rpc("match_medical_vault_chunks", {
    query_embedding: embedding,
    match_count: Math.min(Math.max(args.limit, 1), 12),
    match_threshold: Number.parseFloat(process.env.EVIDENCE_VAULT_MATCH_THRESHOLD ?? "0.72") || 0.72,
  });

  if (error || !Array.isArray(data)) return [];

  return data.map((row: Record<string, unknown>) => ({
    chunkId: String(row.chunk_id),
    sourceId: String(row.source_id),
    title: String(row.title ?? "Vault source"),
    organization: row.organization ? String(row.organization) : undefined,
    year: typeof row.year === "number" ? row.year : undefined,
    section: row.section_title ? String(row.section_title) : undefined,
    quote: String(row.quote ?? "").slice(0, 480),
    url: row.external_url ? String(row.external_url) : "#",
    score: typeof row.similarity === "number" ? row.similarity : 0,
  }));
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
  reason: MedicalVaultStatusReason;
  detail: string;
};

export function getMedicalVaultStatus(): MedicalVaultStatus {
  const flag = Boolean(process.env.EVIDENCE_MEDICAL_VAULT?.trim().match(/^(1|true|on)$/i));
  const hasEmbedApi = Boolean(embeddingApi());
  if (!flag) {
    return {
      enabled: false,
      flag: false,
      hasEmbedApi,
      reason: "disabled",
      detail: "EVIDENCE_MEDICAL_VAULT unset/off — semantic vault не в цепочке Evidence",
    };
  }
  if (!hasEmbedApi) {
    return {
      enabled: false,
      flag: true,
      hasEmbedApi: false,
      reason: "no_embed_key",
      detail: "Флаг включён, но нет OPENROUTER_API_KEY / OPENAI_API_KEY для embeddings",
    };
  }
  return {
    enabled: true,
    flag: true,
    hasEmbedApi: true,
    reason: "ready",
    detail: "Vault search wired (нужны applied migration + embedded published chunks)",
  };
}

export function isMedicalVaultEnabled(): boolean {
  return getMedicalVaultStatus().enabled;
}
