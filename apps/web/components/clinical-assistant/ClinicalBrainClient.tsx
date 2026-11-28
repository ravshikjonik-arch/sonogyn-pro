"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ClinicalBrain, type BrainSession } from "@repo/medical-calculations";
import { createDefaultBus, fmfLikeToPack, visionChecklist, type KnowledgeCitation } from "@repo/knowledge-bus";
import { FMF_KNOWLEDGE_CHUNKS } from "@repo/evidence-retrieval";

/**
 * ClinicalBrainClient — живая страница «ИИ-ассистент платформы» (изменение №8, этап 2).
 * Локальный мозг: роутер → движки → knowledge-bus → CalcContract с цитатами.
 * Данные не покидают устройство; внешний поиск PubMed подключается сервером отдельно.
 */

type Contract = {
  intent: string;
  tool?: string;
  result?: Record<string, unknown>;
  chain?: string[];
  citations: Array<KnowledgeCitation>;
  disclaimer: string;
  missingSlots?: string[];
  notes?: string[];
  checklist?: { nosology: string; title: string; items: Array<{ id: string; label: string }>; note?: string };
};

type EvidenceMeta = {
  tier?: "full" | "registry";
  citationCount?: number;
  registryHintCount?: number;
  evidenceStrength?: string;
  corpusMode?: string;
  insufficient?: boolean;
};

type Message = {
  role: "doctor" | "brain";
  text: string;
  contract?: Contract;
  evidence?: EvidenceMeta | null;
  pending?: boolean;
};

type CorpusPick = "auto" | "all" | "rf_kr";

const QUICK_PROMPTS = [
  "КТР 63",
  "NT 1.8 при КТР 63",
  "CPR: пупочная 1.4, мозговая 0.95",
  "миома интрамуральная",
  "порог NT 3.5 — что делать",
  "опознание образования по фото придатков",
];

const EVIDENCE_QUICK_PROMPTS = [
  "порог NT 3.5 тактика скрининг FMF",
  "клиническая рекомендация МЗ РФ миома",
  "O-RADS 4 тактика",
];

const INTENT_LABEL: Record<string, string> = {
  calculate: "расчёт движком",
  lookup_kr: "база знаний",
  pubmed_search: "внешний поиск",
  image_checklist: "чеклист по фото",
  draft_protocol: "черновик протокола",
  explain_term: "пояснение",
};

const INTENT_COLOR: Record<string, string> = {
  calculate: "rgba(76,195,138,.14)",
  lookup_kr: "rgba(124,92,255,.14)",
  pubmed_search: "rgba(47,158,143,.14)",
  image_checklist: "rgba(232,179,75,.14)",
  draft_protocol: "rgba(124,92,255,.14)",
  explain_term: "rgba(124,92,255,.14)",
};

function ResultView({ result }: { result: Record<string, unknown> }) {
  const rows = Object.entries(result)
    .filter(([, v]) => v !== undefined && v !== null && typeof v !== "object")
    .slice(0, 10);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "2px 12px", fontSize: 12.5 }}>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: "contents" }}>
          <span style={{ color: "var(--clinical-foreground-muted, #8a94a6)" }}>{k}</span>
          <span style={{ fontWeight: 600 }}>{String(v)}</span>
        </div>
      ))}
    </div>
  );
}

export function ClinicalBrainClient() {
  const brainBundle = useMemo(() => {
    const bus = createDefaultBus();
    bus.registerPack(fmfLikeToPack("fmf-pack", FMF_KNOWLEDGE_CHUNKS as never));
    const brain = new ClinicalBrain(bus);
    brain.setVisionResolver((nosology) => {
      const cl = visionChecklist(nosology);
      return cl
        ? {
            nosology: cl.nosology,
            title: cl.title,
            instruction: cl.instruction,
            note: cl.note,
            citation: cl.citation,
            items: cl.items.map((i) => ({ id: i.id, label: i.label })),
          }
        : undefined;
    });
    return brain;
  }, []);

  const sessionRef = useRef<BrainSession | undefined>(undefined);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"local" | "llm">("local");
  const [evidenceMode, setEvidenceMode] = useState(false);
  const [corpusPick, setCorpusPick] = useState<CorpusPick>("auto");
  const [vaultOn, setVaultOn] = useState<boolean | null>(null);
  const [ollamaOk, setOllamaOk] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai/brain")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: { ollama?: boolean; evidenceVault?: { enabled?: boolean } }) => {
        if (!cancelled) {
          setOllamaOk(Boolean(j?.ollama));
          setVaultOn(Boolean(j?.evidenceVault?.enabled));
        }
      })
      .catch(() => {
        if (!cancelled) setOllamaOk(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "brain",
      text:
        "Клинический ассистент: движки + база знаний с цитатами (FMF, FIGO…).\n" +
        "Локально — PHI не уходит с устройства. «+ Evidence» — PubMed, КР МЗ РФ, реестр стандартов на сервере.\n" +
        "Полный EBM-кабинет: /tools/refs/evidence-assistant",
    },
  ]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [
      ...m,
      { role: "doctor", text: trimmed },
      { role: "brain", text: "…", pending: true },
    ]);
    try {
      let turn: Awaited<ReturnType<typeof brainBundle.handle>> | null = null;
      const useServer = evidenceMode || mode === "llm";
      if (useServer) {
        const res = await fetch("/api/ai/brain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: trimmed,
            session: sessionRef.current,
            mode,
            evidence: evidenceMode,
            ...(corpusPick !== "auto" ? { corpusMode: corpusPick } : {}),
          }),
        });
        const j = (await res.json().catch(() => ({}))) as {
          reply?: string;
          intent?: string;
          contract?: unknown;
          session?: BrainSession;
          evidence?: EvidenceMeta | null;
          error?: string;
          message?: string;
        };
        if (res.ok && j.reply) {
          sessionRef.current = j.session;
          setMessages((m) => {
            const copy = [...m];
            copy[copy.length - 1] = {
              role: "brain",
              text: j.reply as string,
              contract: j.contract as unknown as Contract,
              evidence: j.evidence ?? null,
            };
            return copy;
          });
          return;
        }
        if (evidenceMode) {
          const msg =
            res.status === 429
              ? "Лимит запросов Evidence. Подождите минуту или отключите «+ Evidence»."
              : j.message || j.error || `Сервер Evidence (${res.status})`;
          throw new Error(msg);
        }
      }
      turn = await brainBundle.handle(trimmed, sessionRef.current);
      sessionRef.current = turn.session;
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "brain",
          text: turn.reply,
          contract: turn.contract as unknown as Contract,
        };
        return copy;
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : "";
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "brain",
          text:
            detail && detail !== "Error"
              ? detail
              : "Не удалось обработать запрос. Попробуйте переформулировать.",
        };
        return copy;
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 860, margin: "0 auto" }}>
      {/* шапка */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          borderRadius: 14,
          border: "1px solid var(--clinical-border, #262c38)",
          background: "linear-gradient(135deg, rgba(124,92,255,.10), rgba(47,158,143,.08))",
        }}
      >
        <div>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 15 }}>ИИ-ассистент платформы</p>
          <p style={{ margin: 0, fontSize: 11.5, color: "var(--clinical-foreground-muted, #8a94a6)" }}>
            движки считают · пороги из базы знаний с цитатами · решение за врачом
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: ".5px",
              padding: "4px 10px",
              borderRadius: 999,
              background: "rgba(47,158,143,.14)",
              border: "1px solid rgba(47,158,143,.45)",
              color: "var(--clinical-foreground, #e8ecf3)",
              whiteSpace: "nowrap",
            }}
          >
            {evidenceMode ? "СЕРВЕР + EVIDENCE (PubMed, КР)" : "ЛОКАЛЬНО · PHI НЕ ПОКИДАЕТ УСТРОЙСТВО"}
          </span>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              type="button"
              aria-label="Добавлять PubMed, КР МЗ РФ и реестр стандартов через сервер"
              aria-pressed={evidenceMode}
              onClick={() => setEvidenceMode((v) => !v)}
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 999,
                cursor: "pointer",
                border: `1px solid ${evidenceMode ? "rgba(232,179,75,.65)" : "var(--clinical-border, #262c38)"}`,
                background: evidenceMode ? "rgba(232,179,75,.14)" : "transparent",
                color: "var(--clinical-foreground, #e8ecf3)",
              }}
            >
              + Evidence
            </button>
            {evidenceMode ? (
              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10.5 }}>
                <span className="sr-only">Корпус evidence</span>
                <span style={{ color: "var(--clinical-foreground-muted, #8a94a6)" }}>Корпус</span>
                <select
                  value={corpusPick}
                  onChange={(e) => setCorpusPick(e.target.value as CorpusPick)}
                  aria-label="Корпус доказательной базы"
                  style={{
                    fontSize: 10.5,
                    padding: "3px 6px",
                    borderRadius: 8,
                    border: "1px solid var(--clinical-border, #262c38)",
                    background: "var(--clinical-card, #14171f)",
                    color: "var(--clinical-foreground, #e8ecf3)",
                  }}
                >
                  <option value="auto">Авто</option>
                  <option value="all">Международный</option>
                  <option value="rf_kr">КР МЗ РФ</option>
                </select>
                {vaultOn === true ? (
                  <span title="Medical vault в цепочке" style={{ fontSize: 9, opacity: 0.85 }}>
                    vault
                  </span>
                ) : null}
              </label>
            ) : null}
            <button
              type="button"
              aria-label="Режим локального клинического мозга без LLM"
              aria-pressed={mode === "local"}
              onClick={() => setMode("local")}
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 999,
                cursor: "pointer",
                border: `1px solid ${mode === "local" ? "rgba(124,92,255,.6)" : "var(--clinical-border, #262c38)"}`,
                background: mode === "local" ? "rgba(124,92,255,.16)" : "transparent",
                color: "var(--clinical-foreground, #e8ecf3)",
              }}
            >
              Локальный мозг
            </button>
            <button
              type="button"
              aria-label="Режим с локальной Ollama для разбора слотов"
              aria-pressed={mode === "llm"}
              onClick={() => setMode("llm")}
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 999,
                cursor: "pointer",
                border: `1px solid ${mode === "llm" ? "rgba(47,158,143,.6)" : "var(--clinical-border, #262c38)"}`,
                background: mode === "llm" ? "rgba(47,158,143,.16)" : "transparent",
                color: "var(--clinical-foreground, #e8ecf3)",
              }}
            >
              + LLM (Ollama)
            </button>
            <span
              title={ollamaOk ? "Ollama доступна" : ollamaOk === false ? "Ollama не отвечает — работает детерминированный мозг" : "Проверка…"}
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: ollamaOk ? "#4cc38a" : ollamaOk === false ? "#e5646c" : "#7f8798",
                display: "inline-block",
              }}
            />
          </div>
        </div>
      </div>

      {evidenceMode ? (
        <p style={{ margin: 0, fontSize: 11, color: "var(--clinical-foreground-muted, #8a94a6)" }}>
          Evidence: расчёты остаются локальными в движке; PubMed/КР подмешиваются для справочных вопросов.{" "}
          <a href="/tools/refs/evidence-assistant" style={{ color: "#9fe3d4" }}>
            Открыть Evidence Assistant
          </a>
        </p>
      ) : null}

      {/* быстрые запросы */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {(evidenceMode ? [...QUICK_PROMPTS.slice(0, 3), ...EVIDENCE_QUICK_PROMPTS] : QUICK_PROMPTS).map((p) => (
          <button
            key={p}
            onClick={() => void send(p)}
            disabled={busy}
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid var(--clinical-border, #262c38)",
              background: "var(--clinical-card, #14171f)",
              color: "var(--clinical-foreground, #e8ecf3)",
              cursor: busy ? "wait" : "pointer",
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* лента */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          minHeight: 320,
          maxHeight: 560,
          overflowY: "auto",
          padding: 4,
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "doctor" ? "flex-end" : "flex-start",
              maxWidth: "92%",
              background: m.role === "doctor" ? "rgba(124,92,255,.12)" : "var(--clinical-card, #14171f)",
              border: `1px solid ${m.role === "doctor" ? "rgba(124,92,255,.4)" : "var(--clinical-border, #262c38)"}`,
              borderRadius: 14,
              padding: "10px 14px",
              opacity: m.pending ? 0.6 : 1,
            }}
          >
            <p style={{ margin: 0, fontSize: 13.5, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{m.text}</p>

            {m.contract ? (
              <div
                style={{
                  marginTop: 10,
                  paddingTop: 10,
                  borderTop: "1px dashed var(--clinical-border, #262c38)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "3px 9px",
                      borderRadius: 999,
                      background: INTENT_COLOR[m.contract.intent] ?? "rgba(124,92,255,.14)",
                      border: "1px solid var(--clinical-border, #262c38)",
                    }}
                  >
                    {INTENT_LABEL[m.contract.intent] ?? m.contract.intent}
                  </span>
                  {m.contract.tool ? (
                    <span style={{ fontSize: 10.5, color: "var(--clinical-foreground-muted, #8a94a6)" }}>
                      {m.contract.tool}
                    </span>
                  ) : null}
                  {m.evidence ? (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: "rgba(47,158,143,.14)",
                        border: "1px solid rgba(47,158,143,.45)",
                      }}
                    >
                      {m.evidence.tier === "registry"
                        ? `стандарты (${m.evidence.registryHintCount ?? 0})`
                        : `evidence · ${m.evidence.citationCount ?? 0} ист.`}
                      {m.evidence.insufficient ? " · мало данных" : ""}
                    </span>
                  ) : null}
                  {m.contract.notes
                    ?.filter((n) => !n.startsWith("evidence:") && !n.startsWith("corpus:") && n !== "evidence:registry_tier")
                    .map((n) => (
                      <span
                        key={n}
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 999,
                          background: "rgba(232,179,75,.12)",
                          border: "1px solid rgba(232,179,75,.4)",
                        }}
                      >
                        ⚠ {n}
                      </span>
                    ))}
                </div>

                {m.contract.result && Object.keys(m.contract.result).length > 0 ? (
                  <ResultView result={m.contract.result} />
                ) : null}

                {m.contract.chain && m.contract.chain.length > 0 ? (
                  <p style={{ margin: 0, fontSize: 11.5, color: "var(--clinical-foreground-muted, #8a94a6)" }}>
                    Цепочка: {m.contract.chain.join(" → ")}
                  </p>
                ) : null}

                {m.contract.checklist ? (
                  <div style={{ fontSize: 12 }}>
                    <p style={{ margin: "0 0 4px", fontWeight: 700 }}>{m.contract.checklist.title}</p>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      {m.contract.checklist.items.map((it) => (
                        <li key={it.id}>{it.label}</li>
                      ))}
                    </ul>
                    {m.contract.checklist.note ? (
                      <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--clinical-foreground-muted, #8a94a6)" }}>
                        {m.contract.checklist.note}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {m.contract.missingSlots && m.contract.missingSlots.length > 0 ? (
                  <p style={{ margin: 0, fontSize: 11.5, color: "var(--clinical-foreground-muted, #8a94a6)" }}>
                    Ожидаю: {m.contract.missingSlots.join(", ")}
                  </p>
                ) : null}

                {m.contract.citations.length > 0 ? (
                  <div style={{ fontSize: 11, color: "var(--clinical-foreground-muted, #8a94a6)" }}>
                    <p style={{ margin: "0 0 3px", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: ".5px" }}>
                      Источники
                    </p>
                    {m.contract.citations.map((c, ci) => (
                      <p key={ci} style={{ margin: 0 }}>
                        {c.organization}, {c.year} · {c.document}
                        {c.url ? (
                          <>
                            {" · "}
                            <a href={c.url} style={{ color: "#9fe3d4" }}>
                              ссылка
                            </a>
                          </>
                        ) : null}
                      </p>
                    ))}
                  </div>
                ) : null}

                <p style={{ margin: 0, fontSize: 10, color: "var(--clinical-foreground-muted, #8a94a6)" }}>
                  {m.contract.disclaimer}
                </p>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {/* ввод */}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void send(input);
          }}
          placeholder="Спросите: КТР 63 · NT 1.8 при КТР 63 · миома интрамуральная · порог CPR…"
          style={{
            flex: 1,
            padding: "11px 14px",
            borderRadius: 12,
            border: "1px solid var(--clinical-border, #262c38)",
            background: "var(--clinical-card, #14171f)",
            color: "var(--clinical-foreground, #e8ecf3)",
            fontSize: 13.5,
          }}
        />
        <button
          onClick={() => void send(input)}
          disabled={busy || input.trim().length === 0}
          style={{
            padding: "11px 20px",
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(135deg, #7c5cff, #2f9e8f)",
            color: "#fff",
            fontWeight: 800,
            fontSize: 13,
            cursor: busy || input.trim().length === 0 ? "default" : "pointer",
            opacity: busy || input.trim().length === 0 ? 0.6 : 1,
          }}
        >
          Спросить
        </button>
      </div>

      <p style={{ margin: 0, fontSize: 10.5, color: "var(--clinical-foreground-muted, #8a94a6)", textAlign: "center" }}>
        Справочная поддержка для врачей. Не является диагнозом — решение за врачом. Режим «+ Evidence» отправляет
        запрос на сервер (PubMed, Europe PMC, КР, vault); чисто локальный режим — без сети.
      </p>
    </div>
  );
}

export default ClinicalBrainClient;
