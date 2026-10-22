import sharp from "sharp";

import type { ImagingQcIssue } from "./image-qc";

/** Top/bottom overlay bands where burned-in patient text often appears on US exports. */
export async function detectBurnedInTextHeuristic(
  buffer: Buffer,
  mime: string,
): Promise<ImagingQcIssue | null> {
  const normalized = mime.toLowerCase().split(";")[0]?.trim() ?? "";
  if (!normalized.startsWith("image/")) return null;

  try {
    const { data, info } = await sharp(buffer, { failOn: "none" })
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const { width, height } = info;
    if (width < 80 || height < 80) return null;

    const bandRows = Math.max(8, Math.floor(height * 0.12));
    let highContrastPixels = 0;
    let sampled = 0;

    function sampleBand(yStart: number, yEnd: number) {
      for (let y = yStart; y < yEnd; y++) {
        for (let x = 0; x < width; x += 4) {
          const i = y * width + x;
          const v = data[i] ?? 128;
          if (v < 40 || v > 215) highContrastPixels += 1;
          sampled += 1;
        }
      }
    }

    sampleBand(0, bandRows);
    sampleBand(height - bandRows, height);

    const ratio = sampled > 0 ? highContrastPixels / sampled : 0;
    if (ratio > 0.22) {
      return {
        code: "burned_in_text_suspected",
        severity: "warn",
        messageRu:
          "В верхней/нижней части кадра возможен вшитый текст (ФИО, дата). Проверьте обезличивание перед отправкой в облако.",
      };
    }
  } catch {
    return null;
  }

  return null;
}
