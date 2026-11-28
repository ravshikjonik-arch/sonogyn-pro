import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ClinicalBrain, extractSlots } from "./clinicalBrain.js";
import { getTool } from "./toolRegistry.js";
import { STANDARD_DISCLAIMER } from "./toolContract.js";
import type { BrainSession } from "./clinicalBrain.js";

/* --- тестовые шина и pubmed (структурно совместимы с knowledge-bus/pubmed.ts) --- */

const FMF_CHUNK = {
  id: "fmf-nt-99",
  topic: "Порог NT",
  text: "99-й центиль NT примерно 3.5 мм; NT ≥ 3.5 мм — инвазивная диагностика первой линии.",
  nosology: ["obstetrics"],
  tool: "obstetrics_nt_reference",
  flags: ["NT_HIGH"],
  citation: { organization: "FMF", document: "The 11-13 weeks scan", year: 2026, status: "учебный пересказ" },
};

const FIGO_CHUNK = {
  id: "uterus-figo-0-2",
  topic: "Подслизистые типы 0–2",
  text: "Подслизистые узлы вызывают обильные кровотечения; доступ гистероскопный.",
  nosology: ["uterus"],
  tool: "uterus_myoma_figo",
  flags: ["FIGO_SUBMUCOSAL"],
  citation: { organization: "FIGO", document: "Munro 2018", year: 2018, status: "учебный пересказ" },
};

const BUS = {
  search: (query: string, opts?: { nosology?: string; tool?: string; topK?: number }) => {
    const pool = [FMF_CHUNK, FIGO_CHUNK];
    const filtered = pool.filter((c) => {
      if (opts?.tool && c.tool !== opts.tool) return false;
      if (opts?.nosology && !c.nosology.includes(opts.nosology)) return false;
      return true;
    });
    const words = query.toLowerCase();
    const hits = filtered
      .filter((c) => (c.topic + c.text).toLowerCase().split(/\s+/).some((w) => words.includes(w) || w.includes(words.slice(0, 6))))
      .map((chunk, i) => ({ chunk, score: 10 - i }));
    return hits.slice(0, opts?.topK ?? 5);
  },
};

const PUBMED_OK = {
  search: async () => ({
    ok: true as const,
    hits: [
      { title: "Cerebroplacental ratio and stillbirth", year: "2021", journal: "UOG", url: "https://pubmed.ncbi.nlm.nih.gov/1/", source: "pubmed" },
    ],
  }),
};

const PUBMED_FAIL = {
  search: async () => ({ ok: false as const, reason: "Внешний поиск недоступен." }),
};

const VISION = (nosology: string) => {
  if (nosology === "adnexa") {
    return {
      nosology: "adnexa",
      title: "Образование придатков — чеклист",
      instruction: "Отметьте признаки.",
      note: "ИИ не ставит категорию. Решение за врачом.",
      citation: { organization: "ACR/IOTA", document: "O-RADS v2022", year: 2022, status: "учебный пересказ" },
      items: [
        { id: "uni", label: "Однокамерное" },
        { id: "solid", label: "Солидный компонент" },
        { id: "cs", label: "Color score" },
        { id: "acites", label: "Асцит" },
        { id: "size", label: "Наибольший размер" },
      ],
    };
  }
  return undefined;
};

describe("clinicalBrain: оркестратор ассистента", () => {
  it("extractSlots: КТР 63 и NT 1.8 из естественного текста", () => {
    const t = getTool("obstetrics_nt_reference")!;
    const s = extractSlots(t, "nt 1,8 мм при КТР 63");
    assert.equal(s.ntMm, 1.8);
    assert.equal(s.crlMm, 63);
  });

  it("extractSlots: допплер (пупочная/мозговая) и FIGO-локализация", () => {
    const cpr = getTool("obstetrics_cpr")!;
    const s1 = extractSlots(cpr, "пупочная 1.4, мозговая 0.95");
    assert.equal(s1.uaPi, 1.4);
    assert.equal(s1.mcaPi, 0.95);
    const figo = getTool("uterus_myoma_figo")!;
    const s2 = extractSlots(figo, "миома интрамуральная");
    assert.equal(s2.primaryLocation, "intramural");
    const s3 = extractSlots(figo, "узел субсерозный на ножке");
    assert.equal(s3.primaryLocation, "subserosal");
    assert.equal(s3.pedunculatedSubserosal, true);
  });

  it("«КТР 63 миома FIGO» → сначала готовый расчёт КТР, не FIGO-опросник", async () => {
    const brain = new ClinicalBrain(BUS);
    const turn = await brain.handle("КТР 63 миома FIGO");
    assert.equal(turn.intent, "calculate");
    assert.equal(turn.contract.tool, "obstetrics_dating_crl");
    assert.ok(turn.contract.result?.days !== undefined);
  });

  it("«КТР 63» → dating, результат с цитатой LOINC и дисклеймером", async () => {
    const brain = new ClinicalBrain(BUS);
    const turn = await brain.handle("КТР 63");
    assert.equal(turn.intent, "calculate");
    assert.equal(turn.contract.tool, "obstetrics_dating_crl");
    assert.ok((turn.contract.result?.valid as boolean) === true);
    assert.ok(turn.contract.citations.some((c) => c.organization === "LOINC"));
    assert.equal(turn.contract.disclaimer, STANDARD_DISCLAIMER);
    assert.ok(turn.reply.includes("Источники:"));
  });

  it("«nt 1.8 при ктр 63» → nt_reference с MoM и чанком FMF в цитатах", async () => {
    const brain = new ClinicalBrain(BUS);
    const turn = await brain.handle("nt 1.8 при ктр 63");
    assert.equal(turn.contract.tool, "obstetrics_nt_reference");
    assert.ok(turn.contract.result?.mom !== undefined);
    assert.ok(turn.contract.citations.some((c) => c.organization === "FMF"));
  });

  it("«CPR пупочная 1.4 мозговая 0.95» → band reduced", async () => {
    const brain = new ClinicalBrain(BUS);
    const turn = await brain.handle("CPR: пупочная 1.4, мозговая 0.95");
    assert.equal(turn.contract.result?.band, "reduced");
    assert.ok(turn.reply.includes("reduced") || turn.reply.includes("снижен"));
  });

  it("«порог NT 3.5 что делать» → lookup_kr с флагом NT_HIGH", async () => {
    const brain = new ClinicalBrain(BUS);
    const turn = await brain.handle("порог NT 3.5 что делать");
    assert.equal(turn.intent, "lookup_kr");
    assert.ok(turn.contract.notes?.includes("NT_HIGH"));
    assert.ok(turn.reply.includes("базе знаний"));
    assert.ok(turn.reply.includes("FMF"));
  });

  it("мультиход FIGO: «миома интрамуральная» → переспрос → «контакт есть» → FIGO 3", async () => {
    const brain = new ClinicalBrain(BUS);
    const t1 = await brain.handle("миома интрамуральная");
    assert.equal(t1.session.pendingTool, "uterus_myoma_figo");
    assert.ok(t1.contract.missingSlots?.includes("contactsEndometrium"));
    assert.ok(t1.reply.includes("контакт с эндометрием"));
    const t2 = await brain.handle("контакт с эндометрием есть", t1.session);
    assert.equal(t2.contract.result?.figoType, 3);
    assert.equal(t2.session.pendingTool, undefined);
    assert.ok(t2.contract.citations.some((c) => c.organization === "FIGO"));
  });

  it("FIGO в один ход: «субсерозный на ножке» → тип 7", async () => {
    const brain = new ClinicalBrain(BUS);
    const turn = await brain.handle("миома субсерозная на ножке");
    assert.equal(turn.contract.result?.figoType, 7);
  });

  it("FMF-скрининг: не хватает слотов → переспрос с описанием PAPP-A", async () => {
    const brain = new ClinicalBrain(BUS);
    const turn = await brain.handle("fmf скрининг возраст 33 nt 1.8");
    assert.equal(turn.contract.missingSlots?.includes("pappaMom"), true);
    assert.ok(turn.reply.toLowerCase().includes("papp-a"));
    assert.ok(turn.session.pendingTool === "obstetrics_fmf_screening");
  });

  it("pubmed: ok → список публикаций с URL и цитатами PubMed", async () => {
    const brain = new ClinicalBrain(BUS, PUBMED_OK);
    const turn = await brain.handle("найди статьи про CPR и stillbirth");
    assert.equal(turn.intent, "pubmed_search");
    assert.ok(turn.pubmedHits!.length >= 1);
    assert.ok(turn.contract.citations.some((c) => c.organization === "PubMed"));
    assert.ok(turn.reply.includes("https://pubmed.ncbi.nlm.nih.gov/"));
  });

  it("pubmed: fail → graceful fallback на локальную шину", async () => {
    const brain = new ClinicalBrain(BUS, PUBMED_FAIL);
    const turn = await brain.handle("найди статьи про NT");
    assert.equal(turn.intent, "pubmed_search");
    assert.ok(turn.reply.includes("недоступен"));
    assert.equal(turn.contract.disclaimer, STANDARD_DISCLAIMER);
  });

  it("pubmed: провайдер не подключён → честное сообщение + локальный поиск", async () => {
    const brain = new ClinicalBrain(BUS);
    const turn = await brain.handle("найди статьи про NT");
    assert.equal(turn.intent, "pubmed_search");
    assert.ok(turn.reply.includes("не подключён"));
  });

  it("фото придатков → image_checklist с ≥5 пунктами и комплаенс-нотой", async () => {
    const brain = new ClinicalBrain(BUS);
    brain.setVisionResolver(VISION);
    const turn = await brain.handle("опознание образования по фото придатков");
    assert.equal(turn.intent, "image_checklist");
    assert.ok(turn.contract.checklist!.items.length >= 5);
    assert.ok(turn.contract.checklist!.nosology === "adnexa");
    assert.ok(turn.reply.includes("ИИ не ставит категорию") || turn.reply.includes("движок"));
  });

  it("непонятный текст → безопасный lookup, без падений, с дисклеймером", async () => {
    const brain = new ClinicalBrain(BUS);
    const turn = await brain.handle("фгдфгдфг");
    assert.equal(turn.intent, "lookup_kr");
    assert.ok(turn.reply.length > 10);
    assert.equal(turn.contract.disclaimer, STANDARD_DISCLAIMER);
  });

  it("история сессии растёт; каждая brain-реплика записана", async () => {
    const brain = new ClinicalBrain(BUS);
    const t1 = await brain.handle("КТР 63");
    const t2 = await brain.handle("порог NT 3.5", t1.session);
    assert.ok(t2.session.history.length >= 4);
    assert.ok(t2.session.history.every((h) => h.text.length > 0));
  });
});
