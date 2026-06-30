import { createRequire } from "module";
import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { createClient } from "@supabase/supabase-js";

import { putPrivateBlob } from "./blob-upload.mjs";

export const DEFAULT_AUTHOR_IDS = [
  "d1fb4c18-9cef-4973-b8a4-399f2e8fde59",
  "01d63e2e-0a39-4d2b-aa3b-87118edcfc9f",
];

export function loadEnvFile(filePath) {
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

export function mergeWebEnv(webRoot) {
  return {
    ...loadEnvFile(path.join(webRoot, ".env.local.save")),
    ...loadEnvFile(path.join(webRoot, ".env.local")),
    ...process.env,
  };
}

export function createAdminClient(url, serviceKey) {
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function resolveAuthorId(admin, preferred) {
  const candidates = preferred ? [preferred, ...DEFAULT_AUTHOR_IDS] : DEFAULT_AUTHOR_IDS;
  for (const id of candidates) {
    const { data: profile } = await admin.from("profiles").select("id,role,full_name").eq("id", id).maybeSingle();
    if (profile?.id) return profile;
    const { data: user } = await admin.auth.admin.getUserById(id);
    if (user?.user) return { id, role: null, full_name: user.user.email ?? id };
  }
  throw new Error("Author user not found — зарегистрируйтесь на prod и задайте AUTHOR_USER_ID");
}

export async function ensureAuthorRole(admin, author) {
  if (author.role === "author" || author.role === "admin") return;
  const { error } = await admin
    .from("profiles")
    .update({ role: "author", updated_at: new Date().toISOString() })
    .eq("id", author.id);
  if (error) console.warn("⚠ role update:", error.message);
  else console.log("✓ role → author");
}

export async function findCourseByTitle(admin, authorId, title) {
  const { data } = await admin
    .from("courses")
    .select("id,title,status")
    .eq("author_id", authorId)
    .ilike("title", title)
    .limit(1)
    .maybeSingle();
  return data;
}

export async function ensureCourse(admin, { authorId, title, descriptionHtml, priceRub = 0 }) {
  let course = await findCourseByTitle(admin, authorId, title);
  if (!course) {
    const { data, error } = await admin
      .from("courses")
      .insert({
        author_id: authorId,
        title,
        description_html: descriptionHtml,
        status: "published",
        price_rub: priceRub,
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
  return course;
}

export async function ensureModule(admin, { courseId, title, sortOrder }) {
  const { data: existing } = await admin
    .from("course_modules")
    .select("id")
    .eq("course_id", courseId)
    .eq("title", title)
    .maybeSingle();
  if (existing?.id) {
    console.log(`↷ module "${title}": ${existing.id}`);
    return existing.id;
  }
  const { data, error } = await admin
    .from("course_modules")
    .insert({ course_id: courseId, title, sort_order: sortOrder })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  console.log(`✓ module "${title}": ${data.id}`);
  return data.id;
}

export async function ensureVideoLesson(admin, { courseId, moduleId, slug, title, bodyHtml, sortOrder }) {
  const { data: existing } = await admin
    .from("course_lessons")
    .select("id,title,video_file_key,video_processing_status")
    .eq("course_id", courseId)
    .eq("lesson_type", "video")
    .ilike("title", title)
    .maybeSingle();

  if (existing?.id) {
    console.log(`↷ lesson "${title}": ${existing.id}`);
    return existing;
  }

  const { data, error } = await admin
    .from("course_lessons")
    .insert({
      course_id: courseId,
      module_id: moduleId,
      title,
      body_html: bodyHtml,
      lesson_type: "video",
      sort_order: sortOrder,
      is_free_preview: true,
      video_processing_status: "none",
    })
    .select("id,title,video_file_key,video_processing_status")
    .single();
  if (error) throw new Error(error.message);
  console.log(`✓ lesson "${title}": ${data.id} (slug: ${slug})`);
  return data;
}

const ALLOWED_VIDEO_EXT = new Set([".mp4", ".webm"]);
const TRANSCODE_SOURCE_EXT = new Set([".mkv", ".mov", ".avi", ".m4v"]);

const require = createRequire(import.meta.url);

function resolveFfmpegBin() {
  const fromEnv = process.env.FFMPEG_PATH?.trim();
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
  for (const candidate of ["ffmpeg", "/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg"]) {
    try {
      execFileSync(candidate, ["-version"], { stdio: "ignore" });
      return candidate;
    } catch {
      /* try next */
    }
  }
  try {
    const { path: bundled } = require("@ffmpeg-installer/ffmpeg");
    if (bundled && fs.existsSync(bundled)) return bundled;
  } catch {
    /* optional dep */
  }
  return null;
}

let ffmpegBinCache;

function ffmpegBin() {
  if (ffmpegBinCache === undefined) ffmpegBinCache = resolveFfmpegBin();
  return ffmpegBinCache;
}

/** Конвертирует mkv/mov/avi → mp4 во временный файл (нужен ffmpeg в PATH или @ffmpeg-installer/ffmpeg). */
export function transcodeVideoForUpload(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ALLOWED_VIDEO_EXT.has(ext)) return filePath;
  if (!TRANSCODE_SOURCE_EXT.has(ext)) return null;

  const bin = ffmpegBin();
  if (!bin) {
    console.warn(`⚠ ${path.basename(filePath)}: нужен ffmpeg (brew install ffmpeg или npm i -D @ffmpeg-installer/ffmpeg)`);
    return null;
  }

  const outPath = path.join(os.tmpdir(), `sonogyn-seed-${Date.now()}.mp4`);
  console.log(`\n🔄 Transcode ${path.basename(filePath)} → mp4…`);
  execFileSync(
    bin,
    ["-y", "-i", filePath, "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-c:a", "aac", "-movflags", "+faststart", outPath],
    { stdio: "inherit" },
  );
  return outPath;
}

export function resolveVideoMime(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".mp4") return "video/mp4";
  if (ext === ".webm") return "video/webm";
  return null;
}

/** Возвращает путь к mp4/webm, при необходимости транскодируя исходник. */
export function prepareVideoForUpload(filePath) {
  const mime = resolveVideoMime(filePath);
  if (mime) return { path: filePath, mime, temp: false };
  const transcoded = transcodeVideoForUpload(filePath);
  if (!transcoded) return null;
  return { path: transcoded, mime: "video/mp4", temp: true };
}

export async function uploadLessonVideo({ admin, blobToken, courseId, lessonId, filePath }) {
  const prepared = prepareVideoForUpload(filePath);
  if (!prepared) {
    throw new Error(`Unsupported video format (use mp4/webm/mkv): ${filePath}`);
  }
  const { path: uploadPath, mime, temp } = prepared;
  if (!fs.existsSync(uploadPath)) {
    throw new Error(`Video not found: ${uploadPath}`);
  }
  const stat = fs.statSync(uploadPath);
  console.log(`\n⬆ ${path.basename(uploadPath)} (${Math.round(stat.size / 1024 / 1024)} MB)`);
  const blobPath = `courses/${courseId}/lessons/${lessonId}/source-${Date.now()}${path.extname(uploadPath)}`;
  const fileBuffer = fs.readFileSync(uploadPath);
  try {
    const blob = await putPrivateBlob(blobPath, fileBuffer, {
      token: blobToken,
      contentType: mime,
    });
    const { error } = await admin
      .from("course_lessons")
      .update({
        video_file_key: blob.url,
        video_file_url: blob.url,
        video_mime_type: mime,
        video_size_bytes: stat.size,
        video_processing_status: "ready",
        video_upload_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", lessonId);
    if (error) throw new Error(error.message);
    console.log(`✓ video ready: ${lessonId}`);
    return blob.url;
  } finally {
    if (temp) {
      try {
        fs.unlinkSync(uploadPath);
      } catch {
        /* ignore */
      }
    }
  }
}

export function readManifest(manifestPath) {
  if (!fs.existsSync(manifestPath)) return null;
  const raw = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  if (Array.isArray(raw.modules)) return raw;
  if (Array.isArray(raw.lessons)) return { modules: [{ title: "Default", lessons: raw.lessons }], ...raw };
  throw new Error("Manifest must have { modules: [...] } or { lessons: [...] }");
}
