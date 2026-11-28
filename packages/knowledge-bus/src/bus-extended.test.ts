import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createDefaultBus } from "./index.js";
import { VISION_CHECKLISTS, visionChecklist, visionChecklistNosologies } from "./visionChecklists.js";
import {
  europePmcUrl,
  hitToCitation,
  parseEsearch,
  parseEsummary,
  parseEuropePmc,
  pubmedSearchUrl,
  pubmedSummaryUrl,
} from "./pubmed.js";

describe("knowledge-bus: пакеты нозологий + Vision V1 + PubMed", () => {
  it("createDefaultBus: 4 нозологии зарегистрированы, чанки ≥ 20", () => {
    const bus = createDefaultBus();
    const stats = bus.stats();
    assert.equal(stats.packs, 4);
    assert.ok(stats.chunks >= 20, `chunks=${stats.chunks}`);
    for (const n of ["uterus", "adnexa", "breast", "thyroid"]) {
      assert.ok((stats.byNosology[n] ?? 0) >= 4, `${n}=${stats.byNosology[n]}`);
    }
    // поиск по FIGO находит uterus-чанк с привязкой к инструменту
    const hits = bus.search("figo миома классификация тип", { tool: "uterus_myoma_figo" });
    assert.ok(hits.length >= 1);
    assert.equal(hits[0].chunk.tool, "uterus_myoma_figo");
    assert.equal(hits[0].chunk.citation.organization, "FIGO");
  });

  it("поиск O-RADS категорий и TI-RADS порогов в шине", () => {
    const bus = createDefaultBus();
    const orads = bus.search("O-RADS категория риск злокачественности 5", { nosology: "adnexa" });
    assert.ok(orads.length >= 1);
    assert.ok(orads[0].chunk.text.includes("O-RADS"));
    const tirads = bus.search("пороги FNA ti-rads узел", { nosology: "thyroid" });
    assert.ok(tirads.some((h) => h.chunk.text.includes("2.5")));
  });

  it("Vision V1: чеклисты 4 нозологий, уникальные id, комплаенс-нота", () => {
    assert.deepEqual(visionChecklistNosologies().sort(), ["adnexa", "breast", "thyroid", "uterus"]);
    for (const n of visionChecklistNosologies()) {
      const cl = visionChecklist(n)!;
      assert.ok(cl.items.length >= 5, n);
      const ids = cl.items.map((i) => i.id);
      assert.equal(new Set(ids).size, ids.length, n);
      assert.ok(cl.note.length > 10);
      assert.ok(cl.citation.organization);
    }
    // FIGO-чеклист привязан к движку и слотам
    const ut = VISION_CHECKLISTS["uterus"];
    assert.equal(ut.tool, "uterus_myoma_figo");
    assert.ok(ut.items.some((i) => i.slot === "contactsEndometrium"));
    assert.ok(ut.items.some((i) => i.slot === "primaryLocation"));
  });

  it("PubMed: URL-билдеры корректны", () => {
    const q = pubmedSearchUrl("cerebroplacental ratio stillbirth", 5);
    assert.ok(q.includes("eutils.ncbi.nlm.nih.gov"));
    assert.ok(q.includes("db=pubmed"));
    assert.ok(q.includes(encodeURIComponent("cerebroplacental ratio stillbirth")));
    assert.ok(pubmedSummaryUrl(["123", "456"]).includes("id=123,456"));
    assert.ok(europePmcUrl("NT screening").includes("europepmc"));
  });

  it("PubMed: парсеры esearch/esummary/EuropePMC на фикстурах", () => {
    const es = parseEsearch({ esearchresult: { idlist: ["37895412", "36110420"] } });
    assert.deepEqual(es, ["37895412", "36110420"]);
    const sum = parseEsummary({
      result: {
        uids: ["37895412"],
        "37895412": {
          title: "Cerebroplacental ratio for prediction of stillbirth.",
          pubdate: "2023 Feb",
          fulljournalname: "Ultrasound Obstet Gynecol",
          lastauthor: "Smith GC",
        },
      },
    });
    assert.equal(sum.length, 1);
    assert.equal(sum[0].pmid, "37895412");
    assert.equal(sum[0].year, "2023");
    assert.ok(sum[0].url.includes("pubmed.ncbi.nlm.nih.gov/37895412"));
    const epmc = parseEuropePmc({
      resultList: {
        result: [{ title: "First-trimester screening.", pubYear: "2022", pmid: "35123456", journalTitle: "BJOG", authorString: "Ivanov A." }],
      },
    });
    assert.equal(epmc.length, 1);
    assert.equal(epmc[0].source, "europepmc");
    assert.ok(epmc[0].url.includes("35123456"));
    // пустые/битые фикстуры не роняют парсеры
    assert.deepEqual(parseEsearch({}), []);
    assert.deepEqual(parseEsummary({}), []);
    assert.deepEqual(parseEuropePmc({}), []);
  });

  it("hitToCitation: год из строки, организация по источнику", () => {
    const c1 = hitToCitation({ title: "T", year: "2021", url: "https://pubmed.ncbi.nlm.nih.gov/1/", source: "pubmed" });
    assert.equal(c1.organization, "PubMed");
    assert.equal(c1.year, 2021);
    assert.equal(c1.status, "публикация (внешний поиск)");
    const c2 = hitToCitation({ title: "T2", url: "https://europepmc.org", source: "europepmc" });
    assert.equal(c2.organization, "Europe PMC");
    assert.ok(c2.year > 1900);
  });
});
