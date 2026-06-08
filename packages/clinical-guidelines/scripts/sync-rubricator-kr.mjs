#!/usr/bin/env node
/**
 * Синхронизация метаданных КР из официального «Рубрикатора КР» (apicr.minzdrav.gov.ru).
 * Только заголовки, МКБ и ссылки — без текста рекомендаций.
 *
 * Usage: node scripts/sync-rubricator-kr.mjs
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_JSON = join(__dirname, "../src/catalog/synced-kr-mz-rf.json");
const OUT_META = join(__dirname, "../src/catalog/synced-kr-mz-rf.meta.json");

const API_BASE = "https://apicr.minzdrav.gov.ru/api.ashx";
const PREVIEW_BASE = "https://cr.minzdrav.gov.ru/preview-cr";
const AGE_ADULT = 1;
const CONCURRENCY = 12;

/** Корневые главы МКБ для обхода */
const ROOT_CHAPTER_CODES = ["N00-N99", "O00-O99", "C00-D48", "Z00-Z99"];

/** Доп. фильтр по mkblnk для C/Z (весь N и O берём целиком) */
const EXTRA_MKB_PREFIXES = ["C50", "Z30", "Z31", "Z32", "Z33", "Z34", "Z35", "Z36", "Z37", "Z38", "Z39"];

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

function treeUrl(id) {
  return `${API_BASE}?op=GetMkbTreeItem&age=${AGE_ADULT}&id=${encodeURIComponent(id)}&query=`;
}

function inferSpecialty(mkblnk, name) {
  const code = (mkblnk || "").trim();
  const lower = name.toLowerCase();
  if (code.startsWith("O") || /^Z3[4-9]/.test(code)) return "obstetrics";
  if (code.startsWith("C50") || /молочн|mamm/i.test(lower)) return "mammology";
  if (/ультразвук|узи|sonograph/i.test(lower)) return "ultrasound";
  if (code.startsWith("N") || code.startsWith("Z3")) return "obgyn";
  return "general";
}

function inferChapter(mkblnk, name) {
  const code = (mkblnk || "").trim();
  if (code.startsWith("O") || /^Z3[4-9]/.test(code)) return "obstetrics";
  if (code.startsWith("C50") || /молочн|mamm/i.test(name.toLowerCase())) return "ultrasound";
  return "obgyn";
}

function shouldIncludeClinrec(rec, rootChapterCode) {
  const mkblnk = (rec.mkblnk || rec.mkb || "").trim();
  if (rootChapterCode === "N00-N99" || rootChapterCode === "O00-O99") {
    return true;
  }
  return EXTRA_MKB_PREFIXES.some((p) => mkblnk.startsWith(p) || mkblnk.includes(`/${p}`));
}

function toGuideline(rec, rootChapterCode) {
  const code = Number(rec.code);
  const version = Number(rec.version) || 1;
  const mkblnk = (rec.mkblnk || rec.mkb || "").split("/")[0] || "";
  const id = `kr-mz-rf-${code}-v${version}`;
  const title = String(rec.name || "").trim();
  const mkbFull = String(rec.mkb || rec.mkblnk || "").trim();

  return {
    id,
    title,
    summary: mkbFull ? `МКБ: ${mkbFull}. Клинические рекомендации Минздрава РФ.` : "Клинические рекомендации Минздрава РФ.",
    shelf: "kr_mz_rf",
    documentKind: "clinical_recommendation",
    issuer: "mz_rf",
    specialty: inferSpecialty(mkblnk, title),
    year: new Date().getFullYear(),
    status: rec.NPC_approved ? "active" : "active",
    officialUrl: `${PREVIEW_BASE}/${code}_${version}`,
    tags: [mkblnk, rootChapterCode.replace(/-.*/, ""), "КР МЗ РФ", "рубрикатор"].filter(Boolean),
    revisedAt: new Date().toISOString().slice(0, 10),
    /** служебные поля для merge (не в ClinicalGuideline, уберём при записи если нужно) */
    _source: {
      rubricatorCode: code,
      version,
      mkblnk,
      mkb: mkbFull,
      dbId: rec.db_id,
      npcApproved: Boolean(rec.NPC_approved),
      rootChapter: rootChapterCode,
      catalogGroup: inferChapter(mkblnk, title),
    },
  };
}

async function collectFromChapter(rootItem) {
  const seenNodes = new Set();
  const clinrecMap = new Map();
  let pending = [rootItem.id];

  while (pending.length > 0) {
    const batch = pending.splice(0, CONCURRENCY).filter((id) => {
      if (seenNodes.has(id)) return false;
      seenNodes.add(id);
      return true;
    });

    const results = await Promise.all(
      batch.map(async (nodeId) => {
        try {
          return await fetchJson(treeUrl(nodeId));
        } catch (err) {
          console.warn(`  skip node ${nodeId}:`, err.message);
          return null;
        }
      }),
    );

    const next = [];
    for (const data of results) {
      if (!data) continue;

      for (const rec of data.clinrecs || []) {
        if (!shouldIncludeClinrec(rec, rootItem.code)) continue;
        const key = `${rec.code}_${rec.version}`;
        if (!clinrecMap.has(key)) {
          clinrecMap.set(key, toGuideline(rec, rootItem.code));
        }
      }

      for (const item of data.items || []) {
        if (item.crcount > 0 && item.id && !seenNodes.has(item.id)) {
          next.push(item.id);
        }
      }
    }

    pending.push(...next);
  }

  return [...clinrecMap.values()];
}

async function main() {
  console.log("Загрузка корня МКБ-дерева…");
  const root = await fetchJson(treeUrl(""));

  const all = new Map();

  for (const chapterCode of ROOT_CHAPTER_CODES) {
    const chapter = root.items?.find((i) => i.code === chapterCode);
    if (!chapter) {
      console.warn(`Глава ${chapterCode} не найдена, пропуск.`);
      continue;
    }

    console.log(`Обход ${chapter.code} (${chapter.name}), ожидается ~${chapter.crcount} КР…`);
    const items = await collectFromChapter(chapter);
    console.log(`  → собрано ${items.length} уникальных КР`);

    for (const g of items) {
      all.set(g.id, g);
    }
  }

  const guidelines = [...all.values()]
    .map(({ _source, ...rest }) => ({
      ...rest,
      tags: [...new Set(rest.tags)],
    }))
    .sort((a, b) => a.title.localeCompare(b.title, "ru"));

  mkdirSync(dirname(OUT_JSON), { recursive: true });
  writeFileSync(OUT_JSON, `${JSON.stringify(guidelines, null, 2)}\n`, "utf8");

  const meta = {
    syncedAt: new Date().toISOString(),
    source: "https://cr.minzdrav.gov.ru/",
    api: API_BASE,
    total: guidelines.length,
    bySpecialty: guidelines.reduce((acc, g) => {
      acc[g.specialty] = (acc[g.specialty] || 0) + 1;
      return acc;
    }, {}),
    chapters: ROOT_CHAPTER_CODES,
  };
  writeFileSync(OUT_META, `${JSON.stringify(meta, null, 2)}\n`, "utf8");

  console.log(`\nГотово: ${guidelines.length} КР → ${OUT_JSON}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
