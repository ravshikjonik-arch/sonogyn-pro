#!/usr/bin/env node
/**
 * Показывает, к какому Supabase-проекту подключён apps/web (из .env.local).
 * SonoGyn — один проект, env менять не нужно.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    if (/^\s*#/.test(line) || !line.trim()) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    let v = line.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[line.slice(0, eq).trim()] = v;
  }
  return out;
}

const url = loadEnv(envPath).NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const ref = url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "unknown";

console.log(`
SonoGyn Pro — Supabase (из apps/web/.env.local)

  Project ref : ${ref}
  API URL     : ${url || "(не задан)"}

  Dashboard   : https://supabase.com/dashboard/project/${ref}
  SQL Editor  : https://supabase.com/dashboard/project/${ref}/sql/new

  Новый проект Sonogyn-Pro: grnwcbyslttbrqznnunq
  После .env.supabase-new → npm run db:bootstrap-new
`);
