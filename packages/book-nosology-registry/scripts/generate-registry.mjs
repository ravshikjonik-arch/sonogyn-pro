/**
 * Генерирует registry.generated.json из atlas.ru.json четырёх книг + seed-nosology-bridge.json
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dir = path.dirname(fileURLToPath(import.meta.url));
const pkgRoot = path.join(__dir, "..");
const repoRoot = path.join(pkgRoot, "../..");

const BOOKS = [
  {
    bookId: "cervix-morpho",
    atlasJson: "packages/cervix-morphology-atlas/data/atlas.ru.json",
    atlasRoute: "/tools/refs/cervix-morphology-atlas",
    domainLabel: "Шейка матки · гистология",
    defaultZone: "cervix",
    modality: "histology",
  },
  {
    bookId: "kaprin-mammology",
    atlasJson: "packages/mammology-national-atlas/data/atlas.ru.json",
    atlasRoute: "/tools/refs/mammology-national-atlas",
    domainLabel: "Молочная железа",
    defaultZone: "breast",
    modality: "mammography",
  },
  {
    bookId: "prenatal-echo",
    atlasJson: "packages/prenatal-echography-atlas/data/atlas.ru.json",
    atlasRoute: "/tools/refs/prenatal-echography-atlas",
    domainLabel: "Плод · пренатальная эхография",
    defaultZone: "obstetrics",
    modality: "us",
  },
  {
    bookId: "otto-echo",
    atlasJson: "packages/clinical-echocardiography-atlas/data/atlas.ru.json",
    atlasRoute: "/tools/refs/clinical-echocardiography-atlas",
    domainLabel: "Эхокардиография",
    defaultZone: "other",
    modality: "echocardiography",
  },
];

const REFERENCE_SLUGS = new Set([
  "predislovie",
  "sokrashcheniya",
  "uchastniki",
  "metodologiya",
  "epitelialnye-opukholi",
]);

const PRENATAL_ZONE_BY_SLUG = {
  "glava-01": "obstetrics",
  "glava-02": "obstetrics",
  "glava-03": "obstetrics",
  "glava-04": "obstetrics",
  "glava-05": "obstetrics",
  "glava-06": "obstetrics",
  "glava-07": "obstetrics",
  "glava-08": "obstetrics",
  "glava-09": "obstetrics",
  "glava-10": "other",
  "glava-11": "obstetrics",
  "glava-12": "obstetrics",
  "glava-13": "obstetrics",
  "glava-14": "obstetrics",
  "glava-15": "other",
  "glava-16": "obstetrics",
  "glava-17": "obstetrics",
  "glava-18": "obstetrics",
  "glava-19": "obstetrics",
  "glava-20": "obstetrics",
};

const bridge = JSON.parse(
  fs.readFileSync(path.join(pkgRoot, "data/seed-nosology-bridge.json"), "utf8"),
);

/** @type {Record<string, string[]>} */
const reverseBridge = {};
for (const [seedId, bookIds] of Object.entries(bridge)) {
  for (const bid of bookIds) {
    if (!reverseBridge[bid]) reverseBridge[bid] = [];
    if (!reverseBridge[bid].includes(seedId)) reverseBridge[bid].push(seedId);
  }
}

function inferZone(book, ch) {
  if (book.bookId === "prenatal-echo") {
    return PRENATAL_ZONE_BY_SLUG[ch.slug] ?? book.defaultZone;
  }
  const t = `${ch.titleRu} ${ch.sectionRu ?? ""}`.toLowerCase();
  if (/шейк|cervix|cin|hsil/.test(t)) return "cervix";
  if (/плод|беремен|фетом|плацен|воды|твп|многоплод/.test(t)) return "obstetrics";
  if (/сердц|эхокарди|клапан|желудоч/.test(t)) return "other";
  if (/молоч|мамм|bi-rads|желез/.test(t)) return "breast";
  return book.defaultZone;
}

function inferKind(book, ch, imageCount) {
  if (REFERENCE_SLUGS.has(ch.slug)) return "reference";
  if (book.bookId === "otto-echo" && !ch.hasTranslation) return "reference";
  if (imageCount === 0 && book.bookId !== "otto-echo") {
    const facts = ch.keyFactsRu ?? ch.summaryRu ?? [];
    if (facts.length <= 2) return "reference";
  }
  return "clinical";
}

/** @type {import('../src/types.js').BookNosologyEntry[]} */
const entries = [];

for (const book of BOOKS) {
  const atlasPath = path.join(repoRoot, book.atlasJson);
  const doc = JSON.parse(fs.readFileSync(atlasPath, "utf8"));
  for (const ch of doc.chapters) {
    const images = ch.images ?? [];
    const imageCount = images.length;
    const keyFacts = ch.keyFactsRu ?? ch.summaryRu ?? [];
    const id = `book:${book.bookId}:${ch.slug}`;
    const linked = reverseBridge[id] ?? [];
    entries.push({
      id,
      bookId: book.bookId,
      chapterSlug: ch.slug,
      titleRu: ch.titleRu,
      zone: inferZone(book, ch),
      domainLabel: book.domainLabel,
      modality: book.modality,
      kind: inferKind(book, ch, imageCount),
      imageCount,
      summaryRu: keyFacts[0]?.slice(0, 280) ?? ch.titleRu,
      keyFactsRu: keyFacts.slice(0, 12),
      atlasHref: `${book.atlasRoute}?slug=${encodeURIComponent(ch.slug)}`,
      previewImageHref: images[0]?.href,
      linkedSeedNosologyIds: linked,
      printStart: ch.printStart,
      printEnd: ch.printEnd,
      hasTranslation: ch.hasTranslation !== false,
    });
  }
}

function loadPrenatalFindings() {
  const py = path.join(__dir, "parse-prenatal-findings.py");
  const csv =
    process.env.PRENATAL_INDEX_CSV ??
    path.join(process.env.HOME ?? "", "Desktop/sonogyn-prenatal/sonogyn-us-atlas/index.csv");
  try {
    const out = execFileSync("python3", [py, csv], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
    const findings = JSON.parse(out);
    for (const f of findings) {
      f.linkedSeedNosologyIds = reverseBridge[f.id] ?? f.linkedSeedNosologyIds ?? [];
    }
    return findings;
  } catch (e) {
    console.warn("Prenatal findings skip:", e instanceof Error ? e.message : e);
    return [];
  }
}

const prenatalFindings = loadPrenatalFindings();
entries.push(...prenatalFindings);

const out = {
  version: 2,
  generatedAt: new Date().toISOString(),
  entryCount: entries.length,
  clinicalCount: entries.filter((e) => e.kind === "clinical").length,
  prenatalFindingCount: prenatalFindings.length,
  entries,
};

fs.writeFileSync(
  path.join(pkgRoot, "data/registry.generated.json"),
  JSON.stringify(out, null, 2) + "\n",
  "utf8",
);
console.log(
  `Wrote ${entries.length} entries (${out.clinicalCount} clinical, ${prenatalFindings.length} prenatal findings)`,
);
