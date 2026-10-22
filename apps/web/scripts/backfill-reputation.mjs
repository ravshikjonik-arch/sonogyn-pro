#!/usr/bin/env node
/**
 * Пересчёт profiles.reputation / cases_count из reputation_events (service_role).
 * Usage: node apps/web/scripts/backfill-reputation.mjs
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in env (or .env.local via dotenv — load manually).
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

const { data, error } = await admin.rpc("backfill_all_reputation");

if (error) {
  console.error(error.message);
  process.exit(1);
}

console.log(`Backfill complete: ${data} profiles updated.`);
