#!/usr/bin/env node
/**
 * B2: calm fill — allowlisted open PDFs → vault as review_required (optional --publish).
 * Uses the same text-layer extract as Source Studio URL import (unpdf).
 *
 *   node --env-file=apps/web/.env.local apps/web/scripts/seed-open-guidelines-from-url.mjs --dry-run
 *   node --env-file=apps/web/.env.local apps/web/scripts/seed-open-guidelines-from-url.mjs --apply
 *   node --env-file=apps/web/.env.local apps/web/scripts/seed-open-guidelines-from-url.mjs --apply --publish
 *
 * Does not touch WHO NC. Skips URLs already present (external_url match).
 */
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { extractText, getDocumentProxy } from "unpdf";

const MAX_BYTES = 20 * 1024 * 1024;
const MAX_TEXT = 200_000;
const MAX_CHUNK = 1800;

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const OPEN_TEXT = resolve(ROOT, "services/docling-ingest/open-text");

/** Curated open RAE sources (thyroid / US-adjacent). Prefer localText if PDF host times out. */
const CATALOG = [
  {
    title: "КР РАЭ: узловой зоб у взрослых (КР90)",
    organization: "РАЭ / endocrincentr.ru",
    year: 2016,
    source_type: "guideline",
    language: "ru",
    external_url:
      "https://www.endocrincentr.ru/sites/default/files/specialists/science/clinic-recomendations/kr90_uzlovoy_zob_u_vzroslyh.pdf",
    copyright_status: "public_guideline_site",
    license_notes: "Публичная КР РАЭ. B2 seed. Перед publish: проверить актуальность редакции.",
    localText: "kr90_uzlovoy_zob.txt",
  },
  {
    title: "КР РАЭ: гипотиреоз у взрослых",
    organization: "РАЭ / endocrincentr.ru",
    year: 2021,
    source_type: "guideline",
    language: "ru",
    external_url:
      "https://www.endocrincentr.ru/sites/default/files/specialists/science/clinic-recomendations/568_gipotireoz_vzroslye.finalnaya.versiya.pdf",
    copyright_status: "public_guideline_site",
    license_notes: "Публичная КР РАЭ. B2 seed.",
    localText: "rae_gipotireoz.txt",
  },
  {
    title: "КР РАЭ: тиреотоксикоз (болезнь Грейвса / узловой зоб), 2021",
    organization: "РАЭ / endocrincentr.ru",
    year: 2021,
    source_type: "guideline",
    language: "ru",
    external_url:
      "https://www.endocrincentr.ru/sites/default/files/specialists/science/clinic-recomendations/kr_versiya_3.0_fin_otredaktirovan_16.05.2021g.pdf",
    copyright_status: "public_guideline_site",
    license_notes: "Публичная КР РАЭ. B2 seed.",
    localText: "rae_tireotoksikoz_2021.txt",
  },
  {
    title: "КР РАЭ: рак щитовидной железы (КР410)",
    organization: "РАЭ / endocrincentr.ru",
    year: 2018,
    source_type: "guideline",
    language: "ru",
    external_url:
      "https://www.endocrincentr.ru/sites/default/files/specialists/science/clinic-recomendations/kr410.pdf",
    copyright_status: "public_guideline_site",
    license_notes: "Публичная КР РАЭ. B2+/OCR-wave seed.",
    localText: "rae_kr410_thyroid_cancer.txt",
  },
  {
    title: "КР: гестационный сахарный диабет",
    organization: "РАЭ / НМИЦ эндокринологии",
    year: 2020,
    source_type: "guideline",
    language: "ru",
    external_url:
      "https://www.endocrincentr.ru/sites/default/files/all/proektnyj_ofis_po_obespecheniyu_pacientov_s_saharnym_diabetom/klinicheskie_rekomendacii_gestacionnyj_saharnyy_diabet.pdf",
    copyright_status: "public_guideline_site",
    license_notes: "Публичная КР (ГСД). B2+/OCR-wave seed.",
    localText: "rae_gestational_diabetes.txt",
  },
  {
    title: "КР РАЭ: первичная надпочечниковая недостаточность (КР524)",
    organization: "РАЭ / endocrincentr.ru",
    year: 2021,
    source_type: "guideline",
    language: "ru",
    external_url:
      "https://www.endocrincentr.ru/sites/default/files/specialists/science/clinic-recomendations/kr524_pervichnaya_nadpochechnikovaya_nedostatochnost.pdf",
    copyright_status: "public_guideline_site",
    license_notes: "Публичная КР РАЭ. Library fill wave.",
    localText: "rae_kr524_adrenal.txt",
  },
  {
    title: "КР РАЭ: остеопороз",
    organization: "РАЭ / endocrincentr.ru",
    year: 2021,
    source_type: "guideline",
    language: "ru",
    external_url:
      "https://www.endocrincentr.ru/sites/default/files/specialists/science/clinic-recomendations/osteoporoz.pdf",
    copyright_status: "public_guideline_site",
    license_notes: "Публичная КР РАЭ. Library fill wave (text truncated to 200k if huge).",
    localText: "rae_osteoporoz.txt",
  },
  {
    title: "КР РАЭ: сахарный диабет 2 типа у взрослых",
    organization: "РАЭ / endocrincentr.ru",
    year: 2019,
    source_type: "guideline",
    language: "ru",
    external_url:
      "https://www.endocrincentr.ru/sites/default/files/specialists/science/clinic-recomendations/saharnyy_diabet_2_tipa_u_vzroslyh.pdf",
    copyright_status: "public_guideline_site",
    license_notes: "Публичная КР РАЭ. Library fill wave (text truncated to 200k if huge).",
    localText: "rae_dm2_adults.txt",
  },
];

function hash(s) {
  return createHash("sha256").update(s).digest("hex");
}

function splitOversized(content, section) {
  const parts = [];
  let rest = content.trim();
  while (rest.length > MAX_CHUNK) {
    let cut = rest.lastIndexOf("\n", MAX_CHUNK);
    if (cut < MAX_CHUNK * 0.4) cut = rest.lastIndexOf(" ", MAX_CHUNK);
    if (cut < MAX_CHUNK * 0.4) cut = MAX_CHUNK;
    parts.push({ sectionTitle: section, content: rest.slice(0, cut).trim() });
    rest = rest.slice(cut).trim();
  }
  if (rest) parts.push({ sectionTitle: section, content: rest });
  return parts;
}

function chunkPlainText(raw) {
  const normalized = raw.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  const blocks = normalized.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const out = [];
  let buf = "";
  let section = null;
  const flush = () => {
    const content = buf.trim();
    if (!content) return;
    for (const piece of splitOversized(content, section)) {
      out.push({ chunkIndex: out.length, sectionTitle: piece.sectionTitle, content: piece.content });
    }
    buf = "";
  };
  for (const block of blocks) {
    if (buf.length + block.length + 2 > MAX_CHUNK) flush();
    buf = buf ? `${buf}\n\n${block}` : block;
  }
  flush();
  return out;
}

function lightSanitize(text) {
  return text
    .replace(/\u0000/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function pdfToText(bytes) {
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  const joined = Array.isArray(text) ? text.join("\n\n") : String(text ?? "");
  return lightSanitize(joined).slice(0, MAX_TEXT);
}

async function main() {
  const dry = process.argv.includes("--dry-run");
  const apply = process.argv.includes("--apply");
  const publish = process.argv.includes("--publish");
  if (!dry && !apply) {
    console.error("Укажите --dry-run или --apply");
    process.exit(1);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log("NEXT_PUBLIC_SUPABASE_URL:", url ? "найдено" : "отсутствует");
  console.log("SUPABASE_SERVICE_ROLE_KEY:", key ? "найдено" : "отсутствует");
  if (!url || !key) process.exit(1);

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  for (const item of CATALOG) {
    console.log("\n—", item.title);
    const { data: existing } = await supabase
      .from("sources")
      .select("id,review_status,rag_allowed")
      .eq("external_url", item.external_url)
      .maybeSingle();
    if (existing) {
      console.log("  already:", existing.id, existing.review_status, "rag=", existing.rag_allowed);
      if (apply && publish && existing.review_status !== "published") {
        await publishSource(supabase, existing.id);
      }
      continue;
    }

    if (dry) {
      console.log("  dry-run: would fetch + insert review_required");
      continue;
    }

    let text = "";
    const localPath = item.localText ? resolve(OPEN_TEXT, item.localText) : null;
    if (localPath && existsSync(localPath)) {
      text = lightSanitize(readFileSync(localPath, "utf8")).slice(0, MAX_TEXT);
      console.log("  local text", item.localText, "chars", text.length);
    } else {
      let buf;
      try {
        const res = await fetch(item.external_url, {
          redirect: "follow",
          signal: AbortSignal.timeout(120_000),
          headers: { "User-Agent": "SonoGynPro-VaultIngest/1.0", Accept: "application/pdf" },
        });
        if (!res.ok) {
          console.log("  fetch fail", res.status);
          continue;
        }
        buf = new Uint8Array(await res.arrayBuffer());
      } catch (e) {
        console.log("  fetch error", e instanceof Error ? e.message : e);
        continue;
      }
      if (buf.byteLength > MAX_BYTES) {
        console.log("  too large", buf.byteLength);
        continue;
      }
      text = await pdfToText(buf);
    }
    if (text.length < 80) {
      console.log("  no text layer / too short", text.length);
      continue;
    }
    const chunks = chunkPlainText(text);
    console.log("  chars", text.length, "chunks", chunks.length);

    const { data: source, error: sErr } = await supabase
      .from("sources")
      .insert({
        title: item.title,
        organization: item.organization,
        year: item.year,
        source_type: item.source_type,
        language: item.language,
        external_url: item.external_url,
        copyright_status: item.copyright_status,
        license_notes: item.license_notes,
        rag_allowed: false,
        quotation_allowed: true,
        review_status: "review_required",
        version: "1.0.0",
      })
      .select("id")
      .single();
    if (sErr || !source) {
      console.log("  source error", sErr?.message);
      continue;
    }

    const rows = chunks.map((c) => ({
      source_id: source.id,
      section_title: c.sectionTitle,
      chunk_index: c.chunkIndex,
      content: c.content,
      sanitized_content: c.content,
      content_hash: hash(c.content),
      token_count: Math.ceil(c.content.length / 4),
      review_status: "review_required",
    }));
    const { error: cErr } = await supabase.from("source_chunks").insert(rows);
    if (cErr) {
      console.log("  chunks error", cErr.message, "source", source.id);
      continue;
    }
    console.log("  inserted", source.id, "chunks", rows.length);

    if (publish) {
      await publishSource(supabase, source.id);
    }
  }
  console.log("\nDone.");
}

async function publishSource(supabase, sourceId) {
  const { data: src } = await supabase.from("sources").select("id,version").eq("id", sourceId).single();
  if (!src) return;
  const { error: rErr } = await supabase.from("medical_reviews").insert({
    entity_type: "source",
    entity_id: sourceId,
    status: "approved",
    notes: "B2 seed: open RAE guideline URL import",
    reviewed_at: new Date().toISOString(),
    source_version: src.version || "1.0.0",
  });
  if (rErr && !/duplicate|unique/i.test(rErr.message)) {
    console.log("  review error", rErr.message);
    return;
  }
  const { error: uErr } = await supabase
    .from("sources")
    .update({
      review_status: "published",
      rag_allowed: true,
      quotation_allowed: true,
      published_at: new Date().toISOString(),
    })
    .eq("id", sourceId);
  if (uErr) {
    console.log("  publish source error", uErr.message);
    return;
  }
  await supabase
    .from("source_chunks")
    .update({ review_status: "published" })
    .eq("source_id", sourceId);
  console.log("  published", sourceId);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
