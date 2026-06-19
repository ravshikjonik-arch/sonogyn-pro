import type { SupabaseClient } from "@supabase/supabase-js";

import {
  TEACHING_CASE_MEDIA_BUCKET,
  type CaseMediaRow,
} from "@/lib/supabase/case-media-storage";
import type { CaseMediaForAnalysis, PreparedVisionFrame } from "@/lib/ai/us-vision/types";

const MAX_FRAMES = 6;
const MAX_BYTES = 12 * 1024 * 1024;

function guessMime(fileName: string, mediaType: CaseMediaForAnalysis["media_type"]): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".dcm") || mediaType === "dicom") return "application/dicom";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".webm")) return "video/webm";
  return "image/jpeg";
}

export async function downloadCaseMediaRows(
  admin: SupabaseClient,
  rows: CaseMediaForAnalysis[],
): Promise<PreparedVisionFrame[]> {
  const prepared: PreparedVisionFrame[] = [];

  for (const row of rows.slice(0, MAX_FRAMES)) {
    const { data, error } = await admin.storage
      .from(TEACHING_CASE_MEDIA_BUCKET)
      .download(row.storage_path);
    if (error || !data) continue;

    const buffer = Buffer.from(await data.arrayBuffer());
    if (buffer.byteLength > MAX_BYTES) continue;

    const fileName = row.storage_path.split("/").pop() ?? row.id;
    prepared.push({
      mediaId: row.id,
      fileName,
      mediaType: row.media_type,
      mimeType: guessMime(fileName, row.media_type),
      base64: buffer.toString("base64"),
    });
  }

  return prepared;
}

export function toMediaForAnalysis(rows: CaseMediaRow[]): CaseMediaForAnalysis[] {
  return rows.map((r) => ({
    id: r.id,
    storage_path: r.storage_path,
    media_type: r.media_type,
  }));
}
