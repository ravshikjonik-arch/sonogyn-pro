#!/usr/bin/env node
/**
 * Seed: курс «ОТТЕНКИ 2024» + вебinar-урок + mp4 в Vercel Blob.
 *
 * Usage (from apps/web):
 *   node scripts/seed-ottenki-webinar.mjs
 *   node scripts/seed-ottenki-webinar.mjs --dry-run
 *   AUTHOR_USER_ID=uuid VIDEO_PATH=/path/to/1.mp4 node scripts/seed-ottenki-webinar.mjs
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BLOB_READ_WRITE_TOKEN
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

import { putPrivateBlob } from "./lib/blob-upload.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");

const DEFAULT_AUTHOR_IDS = [
  "d1fb4c18-9cef-4973-b8a4-399f2e8fde59",
  "01d63e2e-0a39-4d2b-aa3b-87118edcfc9f",
];

const DEFAULT_VIDEO =
  "/Users/yakrav7700/Yandex.Disk.localized/Загрузки/ОТТЕНКИ-2024/1.mp4";

const COURSE_TITLE = "ОТТЕНКИ 2024";
const MODULE_TITLE = "Вебинары";
const LESSON_TITLE = "ОТТЕНКИ 2024 — запись эфира";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");

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

function mergeEnv() {
  return {
    ...loadEnv(path.join(webRoot, ".env.local.save")),
    ...loadEnv(path.join(webRoot, ".env.local")),
    ...process.env,
  };
}

async function resolveAuthorId(admin, preferred) {
  const candidates = preferred ? [preferred, ...DEFAULT_AUTHOR_IDS] : DEFAULT_AUTHOR_IDS;
  for (const id of candidates) {
    const { data: profile } = await admin.from("profiles").select("id,role,full_name").eq("id", id).maybeSingle();
    if (profile?.id) return profile;
    const { data: user } = await admin.auth.admin.getUserById(id);
    if (user?.user) return { id, role: null, full_name: user.user.email ?? id };
  }
  throw new Error("Author user not found — зарегистрируйтесь на prod и задайте AUTHOR_USER_ID");
}

function createLiveKitRoomName(lessonId) {
  return `webinar-${lessonId.replace(/-/g, "").slice(0, 24)}`;
}

async function ensureWebinarSession(admin, { lessonId, courseId, scheduledAt }) {
  const { data: existing } = await admin
    .from("webinar_sessions")
    .select("id")
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (existing?.id) {
    await admin
      .from("webinar_sessions")
      .update({ scheduled_at: scheduledAt, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    return existing.id;
  }

  const { data, error } = await admin
    .from("webinar_sessions")
    .insert({
      lesson_id: lessonId,
      course_id: courseId,
      room_name: createLiveKitRoomName(lessonId),
      scheduled_at: scheduledAt,
      status: "scheduled",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id;
}

async function findExistingCourse(admin, authorId) {
  const { data } = await admin
    .from("courses")
    .select("id,title,status")
    .eq("author_id", authorId)
    .ilike("title", COURSE_TITLE)
    .limit(1)
    .maybeSingle();
  return data;
}

async function main() {
  console.error(
    "\n✗ Курс «ОТТЕНКИ 2024» снят с публикации (archived).\n" +
      "  Не пересоздавайте. См. scripts/archive-unwanted-courses.mjs\n",
  );
  process.exit(1);

  console.log("\n🎬 Seed ОТТЕНКИ 2024 webinar\n");

  const env = mergeEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const blobToken = env.BLOB_READ_WRITE_TOKEN?.trim();
  const videoPath = (env.VIDEO_PATH ?? DEFAULT_VIDEO).trim();
  const preferredAuthor = env.AUTHOR_USER_ID?.trim();

  if (!url || !serviceKey) {
    console.error("Нужны NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY");
    console.error("  → apps/web/.env.local или: npx vercel env pull .env.local");
    process.exit(1);
  }
  if (!blobToken) {
    console.error("Нужен BLOB_READ_WRITE_TOKEN в .env.local");
    process.exit(1);
  }
  if (!fs.existsSync(videoPath)) {
    console.error(`Видео не найдено: ${videoPath}`);
    process.exit(1);
  }

  const stat = fs.statSync(videoPath);
  console.log(`Video: ${path.basename(videoPath)} (${Math.round(stat.size / 1024 / 1024)} MB)`);

  if (dryRun) {
    console.log("Dry-run OK — env и файл на месте\n");
    return;
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const author = await resolveAuthorId(admin, preferredAuthor);
  console.log(`Author: ${author.full_name ?? author.id} (${author.id})`);

  if (author.role !== "author" && author.role !== "admin") {
    const { error: roleErr } = await admin
      .from("profiles")
      .update({ role: "author", updated_at: new Date().toISOString() })
      .eq("id", author.id);
    if (roleErr) console.warn("⚠ role update:", roleErr.message);
    else console.log("✓ role → author");
  }

  let course = await findExistingCourse(admin, author.id);
  if (!course) {
    const { data, error } = await admin
      .from("courses")
      .insert({
        author_id: author.id,
        title: COURSE_TITLE,
        description_html: "<p>Курс по эхографии «ОТТЕНКИ 2024».</p>",
        status: "published",
        price_rub: 0,
      })
      .select("id,title,status")
      .single();
    if (error) throw new Error(error.message);
    course = data;
    console.log(`✓ course created: ${course.id}`);
  } else {
    await admin
      .from("courses")
      .update({ status: "published", updated_at: new Date().toISOString() })
      .eq("id", course.id);
    console.log(`↷ course exists: ${course.id} → published`);
  }

  let moduleId;
  const { data: modExisting } = await admin
    .from("course_modules")
    .select("id")
    .eq("course_id", course.id)
    .eq("title", MODULE_TITLE)
    .maybeSingle();

  if (modExisting?.id) {
    moduleId = modExisting.id;
    console.log(`↷ module: ${moduleId}`);
  } else {
    const { data: mod, error: modErr } = await admin
      .from("course_modules")
      .insert({ course_id: course.id, title: MODULE_TITLE, sort_order: 0 })
      .select("id")
      .single();
    if (modErr) throw new Error(modErr.message);
    moduleId = mod.id;
    console.log(`✓ module: ${moduleId}`);
  }

  const scheduledAt = new Date(Date.now() - 86400000).toISOString();

  let lessonId;
  const { data: lessonExisting } = await admin
    .from("course_lessons")
    .select("id")
    .eq("course_id", course.id)
    .eq("lesson_type", "webinar")
    .ilike("title", "%ОТТЕНКИ%")
    .maybeSingle();

  if (lessonExisting?.id) {
    lessonId = lessonExisting.id;
    console.log(`↷ lesson: ${lessonId}`);
  } else {
    const { data: lesson, error: lessonErr } = await admin
      .from("course_lessons")
      .insert({
        course_id: course.id,
        module_id: moduleId,
        title: LESSON_TITLE,
        body_html: "<p>Запись вебинара «ОТТЕНКИ 2024».</p>",
        lesson_type: "webinar",
        offline_starts_at: scheduledAt,
        duration_minutes: 90,
        sort_order: 0,
        is_free_preview: true,
        video_processing_status: "uploading",
      })
      .select("id")
      .single();
    if (lessonErr) throw new Error(lessonErr.message);
    lessonId = lesson.id;
    console.log(`✓ lesson: ${lessonId}`);
  }

  const sessionId = await ensureWebinarSession(admin, {
    lessonId,
    courseId: course.id,
    scheduledAt,
  });
  console.log(`✓ webinar_session: ${sessionId}`);

  console.log("\n⬆ Upload to Vercel Blob…");
  const blobPath = `courses/${course.id}/lessons/${lessonId}/source-${Date.now()}.mp4`;
  const fileBuffer = fs.readFileSync(videoPath);
  const blob = await putPrivateBlob(blobPath, fileBuffer, {
    token: blobToken,
    contentType: "video/mp4",
  });
  console.log(`✓ blob: ${blob.url}`);

  const { error: videoErr } = await admin
    .from("course_lessons")
    .update({
      video_file_key: blob.url,
      video_file_url: blob.url,
      video_mime_type: "video/mp4",
      video_size_bytes: stat.size,
      video_processing_status: "ready",
      video_upload_error: null,
      offline_starts_at: scheduledAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", lessonId);

  if (videoErr) throw new Error(videoErr.message);
  console.log("✓ lesson video → ready");

  console.log("\n✅ Готово");
  console.log(`   Author:  https://sonogyn-pro.ru/author/courses/${course.id}`);
  console.log(`   Hub:     https://sonogyn-pro.ru/tools/refs/webinars/${lessonId}`);
  console.log(`   Library: https://sonogyn-pro.ru/library/webinars\n`);
}

main().catch((err) => {
  console.error("✗", err.message ?? err);
  process.exit(1);
});
