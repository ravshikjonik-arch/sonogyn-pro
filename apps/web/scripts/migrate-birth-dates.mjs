#!/usr/bin/env node
/**
 * One-off: normalize auth.users.user_metadata.birth_date from DD.MM.YYYY → ISO YYYY-MM-DD.
 *
 * Usage (service role required):
 *   node --env-file=.env.local apps/web/scripts/migrate-birth-dates.mjs
 *   node --env-file=.env.local apps/web/scripts/migrate-birth-dates.mjs --dry-run
 */
import { createClient } from "@supabase/supabase-js";

const DRY = process.argv.includes("--dry-run");

function parseRu(ru) {
  const t = String(ru).trim().replace(/\s/g, "");
  const m = t.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]) - 1;
  const yyyy = Number(m[3]);
  const d = new Date(yyyy, mm, dd);
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm || d.getDate() !== dd) return null;
  return `${yyyy}-${String(mm + 1).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

function toIso(raw) {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  return parseRu(trimmed);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

let page = 1;
const perPage = 200;
let scanned = 0;
let migrated = 0;
let skipped = 0;

console.log(DRY ? "DRY RUN — no writes" : "LIVE — updating user_metadata");

while (true) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
  if (error) {
    console.error(error.message);
    process.exit(1);
  }
  const users = data.users ?? [];
  if (!users.length) break;

  for (const user of users) {
    scanned += 1;
    const raw = user.user_metadata?.birth_date;
    if (!raw || typeof raw !== "string") {
      skipped += 1;
      continue;
    }
    const iso = toIso(raw);
    if (!iso || iso === raw.trim()) {
      skipped += 1;
      continue;
    }
    const year = Number.parseInt(iso.slice(0, 4), 10);
    console.log(`${user.id}: ${raw} → ${iso}`);
    if (!DRY) {
      const { error: upErr } = await admin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          birth_date: iso,
          birth_year: year,
        },
      });
      if (upErr) {
        console.error(`  FAILED: ${upErr.message}`);
        continue;
      }
    }
    migrated += 1;
  }

  if (users.length < perPage) break;
  page += 1;
}

console.log(`Done. scanned=${scanned} migrated=${migrated} skipped=${skipped}`);
