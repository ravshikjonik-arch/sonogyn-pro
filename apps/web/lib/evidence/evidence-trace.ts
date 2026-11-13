/**
 * Optional Langfuse tracing for Evidence Assistant (Wave 1).
 * No-op unless LANGFUSE_PUBLIC_KEY + LANGFUSE_SECRET_KEY are set.
 * Uses public ingestion HTTP API — no hard dependency on langfuse SDK.
 */

type EvidenceTraceInput = {
  userId: string;
  openAccess: boolean;
  query: string;
  corpusMode: string;
  synthesisMode: string;
  evidenceStrength: string;
  citationCount: number;
  claimCount: number;
  insufficient: boolean;
  latencyMs: number;
  providerStatuses: Record<string, string>;
};

function langfuseConfigured(): { publicKey: string; secretKey: string; host: string } | null {
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY?.trim();
  const secretKey = process.env.LANGFUSE_SECRET_KEY?.trim();
  if (!publicKey || !secretKey) return null;
  const host = (process.env.LANGFUSE_BASE_URL?.trim() || "https://cloud.langfuse.com").replace(
    /\/$/,
    "",
  );
  return { publicKey, secretKey, host };
}

/** Fire-and-forget observation; never throws to callers. */
export function traceEvidenceAsk(input: EvidenceTraceInput): void {
  const cfg = langfuseConfigured();
  if (!cfg) return;

  const traceId = crypto.randomUUID().replace(/-/g, "");
  const observationId = crypto.randomUUID().replace(/-/g, "");
  const now = new Date().toISOString();

  const body = {
    batch: [
      {
        id: crypto.randomUUID(),
        type: "trace-create",
        timestamp: now,
        body: {
          id: traceId,
          name: "evidence.assistant.ask",
          userId: input.openAccess ? undefined : input.userId,
          input: { query: input.query.slice(0, 500), corpusMode: input.corpusMode },
          output: {
            evidenceStrength: input.evidenceStrength,
            citationCount: input.citationCount,
            claimCount: input.claimCount,
            insufficient: input.insufficient,
            synthesisMode: input.synthesisMode,
          },
          metadata: {
            product: "sonogyn-pro",
            surface: "evidence-assistant",
            latencyMs: input.latencyMs,
            providers: input.providerStatuses,
          },
          tags: ["evidence", "wave1", input.insufficient ? "insufficient" : "cited"],
        },
      },
      {
        id: crypto.randomUUID(),
        type: "span-create",
        timestamp: now,
        body: {
          id: observationId,
          traceId,
          name: "evidence.synthesis",
          startTime: now,
          endTime: now,
          metadata: { latencyMs: input.latencyMs },
        },
      },
    ],
  };

  const auth = Buffer.from(`${cfg.publicKey}:${cfg.secretKey}`).toString("base64");

  void fetch(`${cfg.host}/api/public/ingestion`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(body),
  }).catch(() => {
    /* non-fatal */
  });
}

export function isLangfuseEvidenceTracingEnabled(): boolean {
  return langfuseConfigured() !== null;
}
