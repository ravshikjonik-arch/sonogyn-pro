/**
 * clinicalBrain — «думающий и анализирующий» оркестратор ассистента платформы
 * (AI_PLATFORM_WIDE_V2.md §2, изменение №8 этап 2).
 *
 * Детерминированное ядро работает БЕЗ LLM: роутер интентов по ключевым словам,
 * извлечение слотов из естественного текста врача, мультиход-диалог (переспрос
 * недостающих слотов), сборка CalcContract с цитатами из шины знаний.
 * LLM-провайдер (Ollama/WebLLM/облако) подключается СВЕРХУ и может улучшать
 * extraction/routing — контракт и guardrails не меняются.
 *
 * Guardrails: модель/роутер не считают и не «вспоминают» пороги — движки считают,
 * пороги из knowledge-bus с атрибуцией, дисклеймер в каждом ответе.
 */
import { getTool, listTools, runTool, buildContract } from "./toolRegistry.js";
import { STANDARD_DISCLAIMER } from "./toolContract.js";
import type { CalcContract, ToolDefinition, ToolFailure, ToolResult } from "./toolContract.js";

/* ---------- структурные интерфейсы (без cross-package импортов) ---------- */

export interface BrainBusLike {
  search(
    query: string,
    opts?: { nosology?: string; tool?: string; topK?: number },
  ): Array<{
    chunk: {
      id: string;
      topic: string;
      text: string;
      nosology: string[];
      tool?: string;
      flags?: string[];
      citation: { organization: string; document: string; year: number; status: string; url?: string };
    };
    score: number;
  }>;
}

export interface BrainPubMedHit {
  title: string;
  year?: string;
  journal?: string;
  url: string;
  source: string;
}

export interface BrainPubMedLike {
  search(
    query: string,
    opts?: { timeoutMs?: number; topK?: number },
  ): Promise<{ ok: boolean; hits?: BrainPubMedHit[]; reason?: string }>;
}

/* ---------- сессия и ход диалога ---------- */

export interface BrainSession {
  pendingTool?: string;
  slots: Record<string, unknown>;
  history: Array<{ role: "doctor" | "brain"; text: string }>;
}

export interface BrainTurn {
  reply: string;
  intent: CalcContract["intent"];
  contract: CalcContract;
  session: BrainSession;
  pubmedHits?: BrainPubMedHit[];
}

/* ---------- извлечение слотов из естественного текста ---------- */

type NumberExtractor = { kind: "number"; re: RegExp };
type EnumExtractor = { kind: "enum"; pairs: Array<[RegExp, string]> };
type BooleanExtractor = { kind: "boolean"; re: RegExp; negRe?: RegExp };

const EXTRACTORS: Record<string, NumberExtractor | EnumExtractor | BooleanExtractor> = {
  crlMm: { kind: "number", re: /(?:ктр|crl)[^\d\-+]{0,12}(\d{1,3}(?:[.,]\d)?)/i },
  ntMm: { kind: "number", re: /(?:\bnt\b|твп)[^\d\-+]{0,12}(\d(?:[.,]\d{1,2})?)/i },
  uaPi: { kind: "number", re: /(?:пупочн|ua\b|пка\b)[^\d\-+]{0,12}(\d+(?:[.,]\d{1,2})?)/i },
  mcaPi: { kind: "number", re: /(?:мка|мозгов|mca\b)[^\d\-+]{0,12}(\d+(?:[.,]\d{1,2})?)/i },
  ageYears: { kind: "number", re: /(?:возраст[^\d]{0,8}|(\d{1,2})\s*лет)/i },
  gestationalWeeks: { kind: "number", re: /(\d{1,2}(?:[.,]\d)?)\s*(?:нед|недель|wk)/i },
  pappaMom: { kind: "number", re: /(?:pappa|папп)[^\d\-+]{0,12}(\d(?:[.,]\d)?)/i },
  freeBetaHcgMom: { kind: "number", re: /(?:hcg|хгч|бета)[^\d\-+]{0,12}(\d(?:[.,]\d)?)/i },
  fetalHeartRateBpm: { kind: "number", re: /(?:чсс|сердцебиен|bpm)[^\d\-+]{0,12}(\d{2,3})/i },
  nasalBone: {
    kind: "enum",
    pairs: [
      [/носовая[^.]{0,40}(отсутств|не визуализ|нет)/i, "absent"],
      [/носовая/i, "present"],
    ],
  },
  ductusVenosusAWave: {
    kind: "enum",
    pairs: [
      [/(?:венозн|dv)[^.]{0,40}(реверс|reversed)/i, "reversed"],
      [/венозн/i, "normal"],
    ],
  },
  tricuspidRegurgitation: {
    kind: "boolean",
    re: /(?:трикуспид|регургит)/i,
    negRe: /(?:трикуспид|регургит)[^.]{0,20}нет/i,
  },
  primaryLocation: {
    kind: "enum",
    pairs: [
      [/подслиз|в полост/i, "submucosal"],
      [/интрамур/i, "intramural"],
      [/субсероз/i, "subserosal"],
      [/(?:шейк|паразит)/i, "cervical_or_parasitic"],
    ],
  },
  contactsEndometrium: {
    kind: "boolean",
    re: /(?:эндометр|контакт)/i,
    negRe: /(?:эндометр|контакт)[^.]{0,20}нет/i,
  },
  pedunculatedIntracavitary: {
    kind: "boolean",
    re: /(?:на ножке[^.]{0,30}полост|полост[^.]{0,30}на ножке)/i,
  },
  intramuralExtension: {
    kind: "enum",
    pairs: [
      [/(?:менее|<)\s*50/i, "less50"],
      [/(?:≥|более|>=)\s*50/i, "ge50"],
    ],
  },
  pedunculatedSubserosal: {
    kind: "boolean",
    re: /(?:субсероз[^.]{0,30}на ножке|на ножке[^.]{0,30}субсероз)/i,
  },
  subserosalExtension: {
    kind: "enum",
    pairs: [
      [/(?:≥|более|>=)\s*50/i, "ge50"],
      [/(?:менее|<)\s*50/i, "less50"],
    ],
  },
};

/** Извлекает слоты инструмента из свободного текста; известные значения в base не трогает. */
export function extractSlots(
  tool: ToolDefinition,
  text: string,
  base: Record<string, unknown> = {},
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const slot of tool.slots) {
    if (out[slot.name] !== undefined) continue;
    const ex = EXTRACTORS[slot.name];
    if (!ex) continue;
    if (ex.kind === "number") {
      const m = text.match(ex.re);
      if (m) {
        const raw = (m[1] ?? m[2] ?? m[0]).replace(",", ".");
        const n = Number(raw);
        if (Number.isFinite(n)) out[slot.name] = n;
      }
    } else if (ex.kind === "enum") {
      for (const [re, value] of ex.pairs) {
        if (re.test(text)) {
          out[slot.name] = value;
          break;
        }
      }
    } else {
      if (ex.re.test(text)) {
        out[slot.name] = ex.negRe ? !ex.negRe.test(text) : true;
      }
    }
  }
  return out;
}

/* ---------- роутер ---------- */

const NOSOLOGY_KEYWORDS: Record<string, string[]> = {
  adnexa: ["придатк", "яичник", "орадс", "adnex", "o-rads"],
  breast: ["молоч", "бир", "мамм"],
  thyroid: ["щитовид", "тирадс", "тирео", "tirads"],
  uterus: ["миом", "матк", "figo", "фиг"],
  obstetrics: ["плод", "ктр", "nt", "твп", "скрининг", "беремен", "допплер", "cpr", "роды", "bishop", "рубец", "vbac", "фетометр"],
};

const PUBMED_RE = /(?:pubmed|стать|литератур|публикац|доказательств|найди (?:стать|работ))/i;
const PHOTO_RE = /(?:фото|картин|снимок|чеклист признак|опозн|по фото)/i;
const LOOKUP_RE = /(?:порог|норм|тактик|рекоменд|что делать|критери|какой риск|риск)/i;

function detectNosology(text: string): string | undefined {
  for (const [n, words] of Object.entries(NOSOLOGY_KEYWORDS)) {
    if (words.some((w) => text.toLowerCase().includes(w))) return n;
  }
  return undefined;
}

function scoreTool(tool: ToolDefinition, text: string, nosology?: string): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const kw of tool.keywords) if (lower.includes(kw.toLowerCase())) score += 1;
  if (nosology && tool.nosology === nosology) score += 2;
  return score;
}

/** Если из текста уже можно честно посчитать движок — берём его (КТР+миома не уводит в FIGO-опросник). */
function pickReadyTool(
  text: string,
  sessionSlots: Record<string, unknown>,
  nosology?: string,
): ToolDefinition | undefined {
  let best: ToolDefinition | undefined;
  let bestScore = 0;
  for (const t of listTools()) {
    const slots = extractSlots(t, text, sessionSlots);
    const outcome = runTool(t.id, slots);
    if (!outcome.ok) continue;
    const s = scoreTool(t, text, nosology) + Object.keys(slots).length * 0.5;
    if (s > bestScore) {
      bestScore = s;
      best = t;
    }
  }
  return best;
}

function pickTool(text: string, nosology?: string): ToolDefinition | undefined {
  let bestScore = 0;
  const candidates: ToolDefinition[] = [];
  for (const t of listTools()) {
    const s = scoreTool(t, text, nosology);
    if (s > bestScore) {
      bestScore = s;
      candidates.length = 0;
      candidates.push(t);
    } else if (s === bestScore && s > 0) {
      candidates.push(t);
    }
  }
  if (candidates.length === 0) return undefined;
  // тайбрейк: у кого из равных по score извлекается больше слотов из текста
  let best = candidates[0];
  let bestSlots = Object.keys(extractSlots(best, text)).length;
  for (const t of candidates.slice(1)) {
    const n = Object.keys(extractSlots(t, text)).length;
    if (n > bestSlots) {
      best = t;
      bestSlots = n;
    }
  }
  return best;
}

/* ---------- формирование ответа ---------- */

function mainResultLine(result: Record<string, unknown>): string {
  const s = (v: unknown) => (v === undefined || v === null ? undefined : String(v));
  if (s(result.display) && !Array.isArray(result.display)) return s(result.display)!;
  if (s(result.interpretation)) return s(result.interpretation)!;
  if (result.figoType !== undefined) return `${s(result.label)}`;
  if (result.band !== undefined)
    return `${s(result.value)} — ${s(result.band)}: ${s(result.interpretation) ?? ""}`.trim();
  if (result.grams !== undefined) return `${result.grams} г (формула ${s(result.formula)})`;
  if (result.days !== undefined) return `${s(result.display) ?? s(result.days) + " дней"}`;
  if (result.total !== undefined) return `Сумма баллов: ${s(result.total)} — ${s(result.interpretation)}`;
  if (result.tolacEligible !== undefined)
    return `Категория: ${s(result.category)} · допуск TOLAC: ${result.tolacEligible ? "да" : "нет"}`;
  if (Array.isArray(result.risks) && result.risks.length > 0) {
    const risks = result.risks as Array<{ display: string }>;
    return `Риски: ${risks.map((r) => r.display).join(" · ")}`;
  }
  return JSON.stringify(result).slice(0, 220);
}

function dedupeCitations(contract: CalcContract, extra: Array<{ organization: string; document: string; year: number; status: string; url?: string }>): CalcContract {
  const seen = new Set(contract.citations.map((c) => `${c.organization}|${c.document}`));
  for (const c of extra) {
    const key = `${c.organization}|${c.document}`;
    if (!seen.has(key)) {
      contract.citations.push(c);
      seen.add(key);
    }
  }
  return contract;
}

/* ---------- ядро ---------- */

export class ClinicalBrain {
  constructor(
    private readonly bus: BrainBusLike,
    private readonly pubmed?: BrainPubMedLike,
  ) {}

  async handle(text: string, session?: BrainSession): Promise<BrainTurn> {
    const lower = text.toLowerCase();
    const nosology = detectNosology(text);
    const s0: BrainSession = session
      ? { ...session, slots: { ...session.slots }, history: [...session.history, { role: "doctor", text }] }
      : { slots: {}, history: [{ role: "doctor", text }] };

    // 1) PubMed (внешний поиск) — только явный запрос
    if (PUBMED_RE.test(lower)) {
      return this.handlePubMed(text, s0);
    }
    // 2) Vision V1 — фото/чеклист
    if (PHOTO_RE.test(lower)) {
      return this.handleChecklist(nosology ?? "adnexa", s0);
    }
    // 3) продолжение мультихода: есть незакрытый инструмент
    if (s0.pendingTool) {
      const tool = getTool(s0.pendingTool);
      if (tool) return this.handleCalculate(tool, text, s0);
    }
    // 4) явный запрос тактики/порога — lookup в шине знаний
    if (LOOKUP_RE.test(lower)) return this.handleLookup(text, s0, nosology);
    // 5) расчёт: сначала инструмент с готовыми слотами, иначе — по ключевым словам
    const tool = pickReadyTool(text, s0.slots, nosology) ?? pickTool(text, nosology);
    if (tool) return this.handleCalculate(tool, text, s0);
    // 6) иначе — lookup
    return this.handleLookup(text, s0, nosology);
  }

  private handleCalculate(tool: ToolDefinition, text: string, s0: BrainSession): BrainTurn {
    const slots = extractSlots(tool, text, s0.slots);
    const outcome = runTool(tool.id, slots);

    if (!outcome.ok) {
      const failure = outcome as ToolFailure;
      s0.pendingTool = tool.id;
      s0.slots = slots;
      s0.history.push({ role: "brain", text: failure.message });
      const need = failure.missingSlots ?? [];
      const hints = need
        .map((name) => tool.slots.find((sl) => sl.name === name))
        .filter((sl): sl is NonNullable<ReturnType<typeof getTool>> extends never ? never : (typeof sl extends undefined ? never : NonNullable<typeof sl>) => Boolean(sl))
        .map((sl) => `• ${sl.description}`);
      const missingOptional =
        need.length === 0
          ? tool.slots.filter((sl) => !sl.required && slots[sl.name] === undefined).slice(0, 4)
          : [];
      const askList =
        hints.length > 0
          ? hints
          : missingOptional.map((sl) => `• ${sl.description}`);
      const contract = buildContract(failure, { tool: tool.id, slots, intent: "calculate" });
      contract.missingSlots = need.length > 0 ? need : missingOptional.map((sl) => sl.name);
      const reply = `Для «${tool.title}» нужно уточнить:\n${askList.join("\n") || failure.message}`;
      return { reply, intent: "calculate", contract, session: s0 };
    }

    const success = outcome as ToolResult;
    s0.pendingTool = undefined;
    s0.slots = {};

    const busHits = this.bus.search(`${tool.title} ${text}`, { tool: tool.id, topK: 2 });
    const flags: string[] = [];
    for (const hit of busHits) for (const f of hit.chunk.flags ?? []) flags.push(f);
    const contract = buildContract(success, {
      tool: tool.id,
      slots,
      intent: "calculate",
      notes: flags.length > 0 ? flags : undefined,
    });
    dedupeCitations(
      contract,
      busHits.map((h) => h.chunk.citation),
    );

    const flagLine = flags.length > 0 ? `\n⚠ Флаги: ${[...new Set(flags)].join(", ")}` : "";
    const cite = contract.citations.map((c) => `${c.organization}, ${c.year}`).join(" · ");
    const reply = `${tool.title}\n${mainResultLine(success.result)}${flagLine}\n\nИсточники: ${cite}\n${STANDARD_DISCLAIMER}`;
    s0.history.push({ role: "brain", text: reply });
    return { reply, intent: "calculate", contract, session: s0 };
  }

  private handleLookup(text: string, s0: BrainSession, nosology?: string): BrainTurn {
    const hits = this.bus.search(text, { nosology, topK: 3 });
    const flags: string[] = [];
    for (const h of hits) for (const f of h.chunk.flags ?? []) flags.push(f);
    const contract: CalcContract = {
      intent: "lookup_kr",
      citations: hits.map((h) => h.chunk.citation),
      disclaimer: STANDARD_DISCLAIMER,
      notes: flags.length > 0 ? flags : undefined,
    };
    if (hits.length === 0) {
      const reply = `В локальной базе знаний по этому запросу ничего не нашлось. Попробуйте сформулировать иначе (напр. «порог NT 3.5», «FIGO тип миомы») или запросить поиск публикаций («найди статьи …»).`;
      s0.history.push({ role: "brain", text: reply });
      return { reply, intent: "lookup_kr", contract, session: s0 };
    }
    const flagLine = flags.length > 0 ? `\n⚠ Флаги: ${[...new Set(flags)].join(", ")}` : "";
    const reply = `По базе знаний:\n${hits
      .map((h) => `• ${h.chunk.topic}: ${h.chunk.text} — [${h.chunk.citation.organization}, ${h.chunk.citation.year}]`)
      .join("\n")}${flagLine}\n${STANDARD_DISCLAIMER}`;
    s0.history.push({ role: "brain", text: reply });
    return { reply, intent: "lookup_kr", contract, session: s0 };
  }

  private handleChecklist(nosology: string, s0: BrainSession): BrainTurn {
    // чеклисты берём из шины знаний? Нет — из Vision V1 (BusLike не содержит их).
    // Клиентская шина знает чеклисты: передаём через callback-объект.
    const cl = this.visionResolver ? this.visionResolver(nosology) : undefined;
    const contract: CalcContract = {
      intent: "image_checklist",
      citations: cl ? [cl.citation] : [],
      disclaimer: STANDARD_DISCLAIMER,
      checklist: cl
        ? { nosology: cl.nosology, title: cl.title, items: cl.items.map((i) => ({ id: i.id, label: i.label })), note: cl.note }
        : undefined,
    };
    if (!cl) {
      const reply = `Чеклист для нозологии «${nosology}» пока не заведён. Доступные: adnexa, breast, thyroid, uterus.`;
      s0.history.push({ role: "brain", text: reply });
      return { reply, intent: "image_checklist", contract, session: s0 };
    }
    const reply = `${cl.title}\n${cl.instruction}\n${cl.items.map((i, idx) => `${idx + 1}. ${i.label}`).join("\n")}\n\n${cl.note}`;
    s0.history.push({ role: "brain", text: reply });
    return { reply, intent: "image_checklist", contract, session: s0 };
  }

  private async handlePubMed(text: string, s0: BrainSession): Promise<BrainTurn> {
    if (!this.pubmed) {
      const fallback = this.handleLookup(text, s0);
      return {
        ...fallback,
        intent: "pubmed_search",
        reply: `Внешний поиск не подключён. ${fallback.reply}`,
        contract: { ...fallback.contract, intent: "pubmed_search" },
      };
    }
    const outcome = await this.pubmed.search(text, { topK: 5 });
    if (!outcome.ok || !outcome.hits || outcome.hits.length === 0) {
      const fallback = this.handleLookup(text, s0);
      return {
        ...fallback,
        intent: "pubmed_search",
        reply: `${outcome.reason ?? "Внешний поиск недоступен."}\n\n${fallback.reply}`,
        contract: { ...fallback.contract, intent: "pubmed_search" },
      };
    }
    const hits = outcome.hits;
    const citations = hits.map((h) => ({
      organization: h.source === "pubmed" ? "PubMed" : "Europe PMC",
      document: h.journal ? `${h.title} · ${h.journal}` : h.title,
      year: Number(h.year?.match(/\d{4}/)?.[0] ?? 0) || new Date().getFullYear(),
      status: "публикация (внешний поиск)",
      url: h.url,
    }));
    const contract: CalcContract = {
      intent: "pubmed_search",
      citations,
      disclaimer: STANDARD_DISCLAIMER,
    };
    const reply = `Публикации по запросу:\n${hits
      .map((h, i) => `${i + 1}. ${h.title}${h.year ? ` (${h.year})` : ""}${h.journal ? ` · ${h.journal}` : ""}\n   ${h.url}`)
      .join("\n")}\n${STANDARD_DISCLAIMER}`;
    s0.history.push({ role: "brain", text: reply });
    return { reply, intent: "pubmed_search", contract, session: s0, pubmedHits: hits };
  }

  /** Подмена resolver'а чеклистов (клиент передаёт visionChecklist из knowledge-bus). */
  setVisionResolver(resolver: (nosology: string) => { nosology: string; title: string; instruction: string; note: string; citation: { organization: string; document: string; year: number; status: string; url?: string }; items: Array<{ id: string; label: string }> } | undefined): void {
    this.visionResolver = resolver;
  }

  private visionResolver?: (nosology: string) => { nosology: string; title: string; instruction: string; note: string; citation: { organization: string; document: string; year: number; status: string; url?: string }; items: Array<{ id: string; label: string }> } | undefined;
}
