import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { getBucket, presignGetObject, putObjectBuffer } from "@/lib/storage/s3";
import { lessonHlsPlaylistKey, lessonHlsPrefix } from "@/lib/storage/config";
import { markLessonHlsReady } from "@/lib/video/transcode";

/** Dev-only: ffmpeg → HLS сегменты в Object Storage. */
export async function spawnLocalFfmpegHls(params: {
  courseId: string;
  lessonId: string;
  sourceKey: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const ffmpeg = process.env.FFMPEG_PATH?.trim();
  if (!ffmpeg) return { ok: false, error: "FFMPEG_PATH не задан" };

  const tmp = await mkdtemp(join(tmpdir(), "sg-hls-"));
  const outDir = join(tmp, "hls");
  const outPattern = join(outDir, "seg_%03d.ts");
  const playlistPath = join(outDir, "master.m3u8");

  try {
    const { mkdirSync } = await import("node:fs");
    mkdirSync(outDir, { recursive: true });

    const sourceUrl = await presignGetObject(params.sourceKey, 7200);

    await new Promise<void>((resolve, reject) => {
      const proc = spawn(
        ffmpeg,
        [
          "-y",
          "-i",
          sourceUrl,
          "-codec:",
          "copy",
          "-start_number",
          "0",
          "-hls_time",
          "6",
          "-hls_list_size",
          "0",
          "-hls_segment_filename",
          outPattern,
          playlistPath,
        ],
        { stdio: "ignore" },
      );
      proc.on("error", reject);
      proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`))));
    });

    const { readdirSync } = await import("node:fs");
    const files = readdirSync(outDir);
    const prefix = lessonHlsPrefix(params.courseId, params.lessonId);

    for (const file of files) {
      const buf = await readFile(join(outDir, file));
      const key = `${prefix}/${file}`;
      const ct = file.endsWith(".m3u8") ? "application/vnd.apple.mpegurl" : "video/mp2t";
      await putObjectBuffer({ key, body: buf, contentType: ct });
    }

    const hlsKey = lessonHlsPlaylistKey(params.courseId, params.lessonId);
    await markLessonHlsReady({ lessonId: params.lessonId, hlsPlaylistKey: hlsKey });

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "ffmpeg failed" };
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

export function readBucketName(): string {
  return getBucket();
}
