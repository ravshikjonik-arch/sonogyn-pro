#!/usr/bin/env node
/**
 * Сверка Desktop/sonogyn-* с atlas.ru.json и public/clinical-atlas.
 * Usage: node scripts/verify-desktop-book-imports.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const HOME = process.env.HOME ?? "";

const BOOKS = [
  {
    id: "cervix",
    desktop: path.join(HOME, "Desktop/sonogyn-cervix"),
    atlasJson: "packages/cervix-morphology-atlas/data/atlas.ru.json",
    publicDir: "apps/web/public/clinical-atlas/cervix-morpho",
    expectChapters: 17,
    countDesktopImages: (book) => {
      const csv = path.join(book, "cervix-morpho-atlas/index.csv");
      if (!fs.existsSync(csv)) return null;
      return fs.readFileSync(csv, "utf8").trim().split("\n").length - 1;
    },
  },
  {
    id: "mammology",
    desktop: path.join(HOME, "Desktop/sonogyn-mammology"),
    atlasJson: "packages/mammology-national-atlas/data/atlas.ru.json",
    publicDir: "apps/web/public/clinical-atlas/kaprin-mammology",
    expectChapters: 26,
    countDesktopImages: (book) => countFiles(path.join(book, "page_scans_by_chapter"), ".jpg"),
  },
  {
    id: "prenatal",
    desktop: path.join(HOME, "Desktop/sonogyn-prenatal"),
    atlasJson: "packages/prenatal-echography-atlas/data/atlas.ru.json",
    publicDir: "apps/web/public/clinical-atlas/prenatal-echo-ru",
    expectChapters: 20,
    countDesktopImages: (book) => countFiles(path.join(book, "sonogyn-us-atlas"), ".jpx"),
  },
  {
    id: "otto-echo",
    desktop: path.join(HOME, "Desktop/sonogyn-echo"),
    atlasJson: "packages/clinical-echocardiography-atlas/data/atlas.ru.json",
    publicDir: null,
    expectChapters: 48,
    countDesktopImages: () => countFiles(path.join(HOME, "Desktop/sonogyn-echo/translated"), ".md"),
  },
];

function countFiles(dir, ext) {
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name.startsWith(".")) continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (p.endsWith(ext)) n++;
    }
  };
  walk(dir);
  return n;
}

function atlasImageCount(doc) {
  return (doc.chapters ?? []).reduce((a, c) => a + (c.images?.length ?? 0), 0);
}

let failed = false;

for (const b of BOOKS) {
  const deskOk = fs.existsSync(b.desktop);
  const jsonPath = path.join(ROOT, b.atlasJson);
  const jsonOk = fs.existsSync(jsonPath);
  if (!deskOk) {
    console.log(`❌ ${b.id}: нет папки ${b.desktop}`);
    failed = true;
    continue;
  }
  if (!jsonOk) {
    console.log(`❌ ${b.id}: нет ${b.atlasJson}`);
    failed = true;
    continue;
  }
  const doc = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const chapters = doc.chapters?.length ?? 0;
  const metaImages = doc.meta?.usImageCount ?? atlasImageCount(doc);
  const deskImages = b.countDesktopImages(b.desktop);
  const publicJpg = b.publicDir ? countFiles(path.join(ROOT, b.publicDir), ".jpg") : null;
  const translated = doc.meta?.translatedChapterCount;

  const chOk = chapters === b.expectChapters;
  const imgOk =
    b.id === "otto-echo"
      ? translated != null && translated >= 40
      : deskImages != null && metaImages === deskImages;

  console.log(
    `${chOk && imgOk ? "✅" : "⚠️"} ${b.id}: глав ${chapters}/${b.expectChapters}, atlas images/meta ${metaImages}, desktop ${deskImages ?? "—"}, public jpg ${publicJpg ?? "n/a"}${b.id === "otto-echo" ? `, RU глав ${translated}/${chapters}` : ""}`,
  );
  if (!chOk || !imgOk) failed = true;
}

if (failed) {
  console.log("\nИмпорт: pnpm import:desktop-books");
  process.exit(1);
}
console.log("\nВсе четыре книги синхронизированы с Desktop.");
