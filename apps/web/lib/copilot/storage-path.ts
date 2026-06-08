import type { ImageModalityHint } from "@/lib/copilot/types";
import { ULTRASOUND_MEDIA_BUCKET } from "@/lib/copilot/types";

export function sanitizeUploadFileName(raw: string): string {
  const base = raw.replace(/[^\w.\-()+]+/g, "_").replace(/_+/g, "_");
  return base.length > 180 ? base.slice(-180) : base;
}

export function buildImageStoragePath(params: {
  userId: string;
  studyId: string;
  seriesId: string;
  originalFileName: string;
}): { bucket: typeof ULTRASOUND_MEDIA_BUCKET; path: string } {
  const safeName = sanitizeUploadFileName(params.originalFileName || "frame.bin");
  const objectId = crypto.randomUUID();

  return {
    bucket: ULTRASOUND_MEDIA_BUCKET,
    path: `${params.userId}/${params.studyId}/${params.seriesId}/${objectId}_${safeName}`,
  };
}

export function validateRegisteredImagePath(params: {
  userId: string;
  studyId: string;
  seriesId: string;
  storagePath: string;
}): boolean {
  const prefix = `${params.userId}/${params.studyId}/${params.seriesId}/`;
  return params.storagePath.startsWith(prefix);
}

export function inferModalityHint(file: File): ImageModalityHint {
  const type = file.type.toLowerCase();
  if (type.includes("dicom")) return "unknown";
  return "b_mode";
}
