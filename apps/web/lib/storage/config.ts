export type StorageProvider = "yandex" | "vercel-blob" | "s3";

export const MAX_LESSON_VIDEO_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB
export const MULTIPART_PART_SIZE = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_VIDEO_MIME = new Set(["video/mp4", "video/webm"]);
export const ALLOWED_VIDEO_EXT = new Set([".mp4", ".webm"]);

export function readStorageConfig() {
  const provider = (process.env.STORAGE_PROVIDER?.trim() || "yandex") as StorageProvider;
  const bucket = process.env.STORAGE_BUCKET?.trim() || "";
  const accessKey = process.env.STORAGE_ACCESS_KEY?.trim() || "";
  const secretKey = process.env.STORAGE_SECRET_KEY?.trim() || "";
  const endpoint =
    process.env.STORAGE_ENDPOINT?.trim() ||
    (provider === "yandex" ? "https://storage.yandexcloud.net" : undefined);
  const region = process.env.STORAGE_REGION?.trim() || "ru-central1";

  return { provider, bucket, accessKey, secretKey, endpoint, region };
}

export function isObjectStorageConfigured(): boolean {
  const c = readStorageConfig();
  if (c.provider === "vercel-blob") {
    return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
  }
  return Boolean(c.bucket && c.accessKey && c.secretKey && c.endpoint);
}

export function lessonSourceVideoKey(courseId: string, lessonId: string, ext: string): string {
  const safeExt = ext.startsWith(".") ? ext : `.${ext}`;
  return `courses/${courseId}/lessons/${lessonId}/source${safeExt}`;
}

export function lessonHlsPrefix(courseId: string, lessonId: string): string {
  return `courses/${courseId}/lessons/${lessonId}/hls`;
}

export function lessonHlsPlaylistKey(courseId: string, lessonId: string): string {
  return `${lessonHlsPrefix(courseId, lessonId)}/master.m3u8`;
}
