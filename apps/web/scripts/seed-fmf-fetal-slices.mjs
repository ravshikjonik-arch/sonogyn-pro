#!/usr/bin/env node
/**
 * Seed: курс «FMF Ambassador · плодовые срезы» — video-уроки + опциональный mp4 в Blob.
 *
 * Usage (from apps/web):
 *   node scripts/seed-fmf-fetal-slices.mjs --dry-run
 *   node scripts/seed-fmf-fetal-slices.mjs
 *   node scripts/seed-fmf-fetal-slices.mjs --video isuog-first-trimester-2023=/path/to/lecture.mp4
 *   MANIFEST_PATH=scripts/custom.json node scripts/seed-fmf-fetal-slices.mjs
 *
 * Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, BLOB_READ_WRITE_TOKEN (для upload)
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import {
  createAdminClient,
  ensureAuthorRole,
  ensureCourse,
  ensureModule,
  ensureVideoLesson,
  mergeWebEnv,
  readManifest,
  resolveAuthorId,
  uploadLessonVideo,
} from "./lib/seed-course-video.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.join(__dirname, "..");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const cliVideos = new Map();
for (const arg of args) {
  if (!arg.startsWith("--video=")) continue;
  const pair = arg.slice("--video=".length);
  const eq = pair.indexOf("=");
  if (eq < 1) continue;
  cliVideos.set(pair.slice(0, eq), pair.slice(eq + 1));
}

function defaultManifestPath() {
  return path.join(__dirname, "fmf-fetal-slices.manifest.json");
}

function lessonVideoPath(lesson) {
  const fromCli = cliVideos.get(lesson.slug);
  if (fromCli) return fromCli.trim();
  if (lesson.videoPath?.trim()) return lesson.videoPath.trim();
  const envKey = `VIDEO_${lesson.slug.replace(/-/g, "_").toUpperCase()}`;
  if (process.env[envKey]?.trim()) return process.env[envKey].trim();
  return null;
}

async function main() {
  console.error(
    "\n✗ Курс «FMF Ambassador · плодовые срезы» снят с публикации (archived).\n" +
      "  Не пересоздавайте. См. scripts/archive-unwanted-courses.mjs\n",
  );
  process.exit(1);

  console.log("\n🎬 Seed FMF Ambassador · плодовые срезы\n");

  const manifestPath = (process.env.MANIFEST_PATH ?? defaultManifestPath()).trim();
  const manifest = readManifest(manifestPath);
  if (!manifest) {
    console.error(`Manifest not found: ${manifestPath}`);
    process.exit(1);
  }

  const env = mergeWebEnv(webRoot);
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const blobToken = env.BLOB_READ_WRITE_TOKEN?.trim();
  const preferredAuthor = env.AUTHOR_USER_ID?.trim();

  if (!url || !serviceKey) {
    console.error("Нужны NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const pendingUploads = [];
  const uploadableExt = new Set([".mp4", ".webm", ".mkv", ".mov", ".avi", ".m4v"]);
  for (const mod of manifest.modules) {
    for (const lesson of mod.lessons) {
      const vp = lessonVideoPath(lesson);
      if (!vp) continue;
      if (!fs.existsSync(vp)) {
        console.warn(`⚠ skip ${lesson.slug}: file missing ${vp}`);
        continue;
      }
      const ext = path.extname(vp).toLowerCase();
      if (!uploadableExt.has(ext)) {
        console.warn(`⚠ skip ${lesson.slug}: unsupported ${ext}`);
        continue;
      }
      pendingUploads.push({ lesson, path: vp });
    }
  }

  console.log(`Manifest: ${manifestPath}`);
  console.log(`Modules: ${manifest.modules.length}, lessons: ${manifest.modules.reduce((n, m) => n + m.lessons.length, 0)}`);
  console.log(`Videos to upload: ${pendingUploads.length}`);

  if (dryRun) {
    console.log("\nDry-run OK\n");
    return;
  }

  if (pendingUploads.length > 0 && !blobToken) {
    console.error("BLOB_READ_WRITE_TOKEN нужен для загрузки видео");
    process.exit(1);
  }

  const admin = createAdminClient(url, serviceKey);
  const author = await resolveAuthorId(admin, preferredAuthor);
  console.log(`Author: ${author.full_name ?? author.id} (${author.id})`);
  await ensureAuthorRole(admin, author);

  const course = await ensureCourse(admin, {
    authorId: author.id,
    title: manifest.courseTitle,
    descriptionHtml: manifest.courseDescription,
    priceRub: 0,
  });

  const lessonIds = [];
  let moduleOrder = 0;
  for (const mod of manifest.modules) {
    const moduleId = await ensureModule(admin, {
      courseId: course.id,
      title: mod.title,
      sortOrder: moduleOrder++,
    });
    let lessonOrder = 0;
    for (const lesson of mod.lessons) {
      const row = await ensureVideoLesson(admin, {
        courseId: course.id,
        moduleId,
        slug: lesson.slug,
        title: lesson.title,
        bodyHtml: lesson.bodyHtml,
        sortOrder: lessonOrder++,
      });
      lessonIds.push({ slug: lesson.slug, id: row.id, title: lesson.title });
    }
  }

  for (const { lesson, path: videoPath } of pendingUploads) {
    const target = lessonIds.find((l) => l.slug === lesson.slug);
    if (!target) continue;
    await uploadLessonVideo({
      admin,
      blobToken,
      courseId: course.id,
      lessonId: target.id,
      filePath: videoPath,
    });
  }

  console.log("\n✅ Готово");
  console.log(`   Author:  https://sonogyn-pro.ru/author/courses/${course.id}`);
  console.log(`   Course:  https://sonogyn-pro.ru/library/courses/${course.id}`);
  for (const l of lessonIds.slice(0, 5)) {
    console.log(`   · ${l.title}: https://sonogyn-pro.ru/library/courses/${course.id}/lessons/${l.id}`);
  }
  if (lessonIds.length > 5) console.log(`   … +${lessonIds.length - 5} уроков`);
  console.log("");
}

main().catch((err) => {
  console.error("✗", err.message ?? err);
  process.exit(1);
});
