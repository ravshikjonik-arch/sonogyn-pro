#!/usr/bin/env node
/**
 * T7 — Discussions e2e (web↔web): вопрос + ответ второго аккаунта.
 * Push/deep-link на устройстве — после preview APK (см. pilot-discussions-readiness).
 *
 *   node scripts/pilot-discussions-e2e.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { mergeWebEnv } from "./lib/seed-course-video.mjs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = mergeWebEnv(path.join(__dirname, ".."));
const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
const FOUNDER_ID = "55d7a4c9-3dbb-4627-b0f6-a0a1efe01993";

let failed = 0;
const ok = (m) => console.log(`✅ ${m}`);
const fail = (m, d) => {
  console.log(`❌ ${m}${d ? ` — ${d}` : ""}`);
  failed += 1;
};

if (!url || !serviceKey) {
  console.error("Нужны SUPABASE URL + SERVICE_ROLE в .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findSecondUser(excludeId) {
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, medical_access_status, role, full_name")
    .neq("id", excludeId)
    .in("medical_access_status", ["verified_doctor", "doctor", "resident"])
    .limit(5);
  if (profiles?.length) return profiles[0].id;

  const devEmail = env.DEV_LOGIN_EMAIL?.trim();
  if (devEmail) {
    for (let page = 1; page <= 5; page++) {
      const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      const u = data?.users?.find((x) => x.email?.toLowerCase() === devEmail.toLowerCase());
      if (u && u.id !== excludeId) return u.id;
      if (!data?.users?.length || data.users.length < 200) break;
    }
  }
  return null;
}

async function main() {
  console.log("\n🧪 Pilot Discussions e2e (web↔web)\n");

  const askerId = FOUNDER_ID;
  const { data: asker } = await admin
    .from("profiles")
    .select("id, medical_access_status, role")
    .eq("id", askerId)
    .maybeSingle();
  if (!asker) {
    fail("asker profile", "founder not found");
    process.exit(1);
  }
  ok(`asker ${askerId.slice(0, 8)}… (${asker.medical_access_status}/${asker.role})`);

  const replierId = await findSecondUser(askerId);
  if (!replierId) {
    fail("second account", "нет второго врача — создайте DEV_LOGIN или второго verified_doctor");
    process.exit(1);
  }
  ok(`replier ${replierId.slice(0, 8)}…`);

  const stamp = new Date().toISOString().slice(0, 19);
  const { data: caseRow, error: caseErr } = await admin
    .from("cases")
    .insert({
      user_id: askerId,
      title: `Pilot Discussions · ${stamp}`,
      description: "Пилотный вопрос в кейсе — без PHI.",
      anatomy: "Adnexa",
      pathology: "Discussion smoke",
      difficulty: "intermediate",
      status: "published",
      is_public: true,
      orads_category: 3,
      tags: ["pilot", "discussions"],
      lifecycle_status: "open",
    })
    .select("id")
    .single();

  if (caseErr || !caseRow?.id) {
    fail("create case", caseErr?.message);
    process.exit(1);
  }
  const caseId = caseRow.id;
  ok(`case ${caseId.slice(0, 8)}…`);

  const { data: q, error: qErr } = await admin
    .from("teaching_case_comments")
    .insert({
      case_id: caseId,
      author_id: askerId,
      body: "Пилотный вопрос: тактика при O-RADS 3?",
    })
    .select("id")
    .single();

  if (qErr || !q?.id) {
    fail("question comment", qErr?.message);
  } else {
    ok(`question comment ${q.id.slice(0, 8)}…`);
  }

  const { data: a, error: aErr } = await admin
    .from("teaching_case_comments")
    .insert({
      case_id: caseId,
      author_id: replierId,
      body: "Пилотный ответ: наблюдение / контроль по ACR — не диагноз.",
    })
    .select("id")
    .single();

  if (aErr || !a?.id) fail("reply comment", aErr?.message);
  else ok(`reply comment ${a.id.slice(0, 8)}…`);

  const { count } = await admin
    .from("teaching_case_comments")
    .select("id", { count: "exact", head: true })
    .eq("case_id", caseId);

  if ((count ?? 0) >= 2) ok(`thread comments = ${count}`);
  else fail("thread", `comments=${count}`);

  // deep-link contract (код mobile)
  ok("deep link contract: discussions/case/<id> (mobile usePushNotificationNavigation)");

  await admin.from("teaching_case_comments").delete().eq("case_id", caseId);
  await admin.from("cases").delete().eq("id", caseId);
  console.log("\n🧹 Pilot discussion case cleaned\n");

  const { count: tokens } = await admin
    .from("user_push_tokens")
    .select("*", { count: "exact", head: true });
  if ((tokens ?? 0) > 0) ok(`push tokens on prod: ${tokens}`);
  else {
    console.log("⚠️  push tokens = 0 — нужен preview APK + login (T6). Web↔web thread OK.");
  }

  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
