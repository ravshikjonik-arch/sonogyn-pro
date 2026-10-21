#!/usr/bin/env node
/**
 * Upload a local public/clinical-atlas subfolder to Supabase Storage (public bucket).
 * Usage: node scripts/upload-clinical-atlas-folder.mjs prenatal-echo-ru
 */
import { createClient } from "@supabase/supabase-js";
import { createReadStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");
loadEnv({ path: path.join(webRoot, ".env.local") });

const folder = process.argv[2]?.trim();
if (!folder || folder.includes("..")) {
  console.error("Usage: node scripts/upload-clinical-atlas-folder.mjs <folder-name>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in apps/web/.env.local");
  process.exit(1);
}

const localRoot = path.join(webRoot, "public/clinical-atlas", folder);
const bucket = "clinical-atlas";
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...(await walk(full)));
    else if (e.isFile()) files.push(full);
  }
  return files;
}

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((b) => b.name === bucket)) return;
  const { error } = await supabase.storage.createBucket(bucket, { public: true });
  if (error) throw new Error(`createBucket: ${error.message}`);
}

async function main() {
  const files = await walk(localRoot);
  console.log(`Uploading ${files.length} files → ${bucket}/${folder}/`);
  await ensureBucket();

  let ok = 0;
  for (const filePath of files) {
    const rel = path.relative(localRoot, filePath).split(path.sep).join("/");
    const storagePath = `${folder}/${rel}`;
    const body = createReadStream(filePath);
    const contentType = filePath.endsWith(".jpg") ? "image/jpeg" : "application/octet-stream";
    const { error } = await supabase.storage.from(bucket).upload(storagePath, body, {
      upsert: true,
      contentType,
      cacheControl: "public, max-age=31536000, immutable",
    });
    if (error) {
      console.error(`FAIL ${storagePath}: ${error.message}`);
      process.exitCode = 1;
      continue;
    }
    ok++;
    if (ok % 50 === 0) console.log(`  ${ok}/${files.length}`);
  }
  console.log(`Done: ${ok}/${files.length} uploaded. Public base: ${url}/storage/v1/object/public/${bucket}/${folder}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
