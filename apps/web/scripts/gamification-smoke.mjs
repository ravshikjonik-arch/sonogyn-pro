#!/usr/bin/env node
/**
 * Smoke: gamification tables + Prisma catalog (service role / DATABASE_URL).
 *
 *   node scripts/gamification-smoke.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[t.slice(0, i).trim()] = v;
  }
  return out;
}

const env = {
  ...loadEnv(path.join(webRoot, ".env.local.save")),
  ...loadEnv(path.join(webRoot, ".env.local")),
  ...process.env,
};

async function supabaseSmoke() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.log("⚠ skip Supabase: no URL/service key");
    return false;
  }
  const admin = createClient(url, key, { auth: { persistSession: false } });
  const tables = ["prisma_achievements", "prisma_user_achievements", "prisma_user_progress"];
  let ok = true;
  for (const table of tables) {
    const { count, error } = await admin.from(table).select("*", { count: "exact", head: true });
    if (error) {
      console.log(`✗ ${table}: ${error.message}`);
      ok = false;
    } else {
      console.log(`✓ ${table}: ${count ?? 0} rows`);
    }
  }
  return ok;
}

async function prismaSmoke() {
  const dbUrl = env.DATABASE_URL?.trim();
  if (!dbUrl) {
    console.log("⚠ skip Prisma: DATABASE_URL not set (Vercel prod may still have it)");
    return null;
  }
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    const n = await prisma.achievement.count();
    console.log(`✓ Prisma Achievement catalog: ${n} badges`);
    return n > 0;
  } catch (e) {
    console.log(`✗ Prisma: ${e.message}`);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log("\n🏅 Gamification smoke\n");
  const sb = await supabaseSmoke();
  const pr = await prismaSmoke();
  const ok = sb !== false && pr !== false;
  console.log(ok ? "\nOK\n" : "\nIssues found\n");
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
