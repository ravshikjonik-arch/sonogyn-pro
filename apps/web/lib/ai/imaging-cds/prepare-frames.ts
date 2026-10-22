import { stripImageMetadata } from "@/lib/security/strip-image-metadata";

import { isImagingCdsStrictQcEnabled, isImagingCdsV2Enabled } from "./flags";
import { runImagingQc, type ImagingQcIssue } from "./image-qc";

export type PreparedImagingFrame = {
  fileName: string;
  mimeType: string;
  base64: string;
};

export type PrepareFramesResult =
  | {
      ok: true;
      frames: PreparedImagingFrame[];
      qcIssues: ImagingQcIssue[];
      metadataStripped: boolean;
    }
  | { ok: false; error: string; qcIssues: ImagingQcIssue[] };

export async function prepareImagingFramesForAnalysis(
  frames: Array<{ fileName: string; mimeType: string; base64: string }>,
): Promise<PrepareFramesResult> {
  if (!frames.length) {
    return { ok: true, frames: [], qcIssues: [], metadataStripped: false };
  }

  if (!isImagingCdsV2Enabled()) {
    return { ok: true, frames, qcIssues: [], metadataStripped: false };
  }

  const out: PreparedImagingFrame[] = [];
  const allIssues: ImagingQcIssue[] = [];
  let strippedAny = false;

  for (const frame of frames) {
    let buffer: Buffer;
    try {
      buffer = Buffer.from(frame.base64, "base64");
    } catch {
      return { ok: false, error: "Некорректное base64 изображения", qcIssues: allIssues };
    }

    const strip = await stripImageMetadata(buffer, frame.mimeType);
    if (!strip.ok) {
      return { ok: false, error: strip.error, qcIssues: allIssues };
    }
    if (strip.stripped) strippedAny = true;

    const qc = await runImagingQc(strip.buffer, strip.contentType);
    allIssues.push(...qc.issues);

    if (!qc.ok && isImagingCdsStrictQcEnabled()) {
      const msg = qc.issues.find((i) => i.severity === "block")?.messageRu ?? "Качество изображения не подходит для анализа.";
      return { ok: false, error: msg, qcIssues: allIssues };
    }

    out.push({
      fileName: frame.fileName,
      mimeType: strip.contentType,
      base64: strip.buffer.toString("base64"),
    });
  }

  return { ok: true, frames: out, qcIssues: allIssues, metadataStripped: strippedAny };
}
