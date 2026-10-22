import sharp from "sharp";

export type ImagingQcIssue = {
  code: string;
  severity: "block" | "warn";
  messageRu: string;
};

export type ImagingQcResult = {
  ok: boolean;
  issues: ImagingQcIssue[];
  width?: number;
  height?: number;
  mime: string;
};

const SUPPORTED = new Set(["image/jpeg", "image/png", "image/webp"]);

function isHeic(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  const ftyp = buffer.subarray(4, 8).toString("ascii");
  if (ftyp !== "ftyp") return false;
  const brand = buffer.subarray(8, 12).toString("ascii").toLowerCase();
  return brand.includes("heic") || brand.includes("heif") || brand.includes("mif1");
}

function isLikelyScreenPhoto(stats: sharp.Stats): boolean {
  const channels = [stats.channels[0], stats.channels[1], stats.channels[2]].filter(Boolean);
  if (channels.length < 3) return false;
  const maxStd = Math.max(...channels.map((c) => c?.stdev ?? 0));
  return maxStd < 8;
}

/**
 * Pre-analyze QC on de-identified raster buffer.
 * Does not replace clinical review; blocks obvious bad inputs when strict mode is on.
 */
export async function runImagingQc(buffer: Buffer, mime: string): Promise<ImagingQcResult> {
  const issues: ImagingQcIssue[] = [];
  const normalizedMime = mime.toLowerCase().split(";")[0]?.trim() ?? "";

  if (isHeic(buffer)) {
    issues.push({
      code: "heic_unsupported",
      severity: "block",
      messageRu: "HEIC/HEIF пока не поддерживается. Экспортируйте кадр в JPEG или PNG.",
    });
    return { ok: false, issues, mime: normalizedMime };
  }

  if (!SUPPORTED.has(normalizedMime)) {
    issues.push({
      code: "unsupported_mime",
      severity: "block",
      messageRu: "Формат не поддерживается. Используйте JPEG, PNG или WebP (или DICOM через worker).",
    });
    return { ok: false, issues, mime: normalizedMime };
  }

  if (buffer.length < 4_096) {
    issues.push({
      code: "file_too_small",
      severity: "warn",
      messageRu: "Файл очень маленький — возможно, не полноценный снимок.",
    });
  }

  let width = 0;
  let height = 0;
  try {
    const meta = await sharp(buffer, { failOn: "none" }).metadata();
    width = meta.width ?? 0;
    height = meta.height ?? 0;
    if (width > 0 && height > 0 && (width < 120 || height < 120)) {
      issues.push({
        code: "resolution_low",
        severity: "block",
        messageRu: "Разрешение слишком низкое для анализа признаков. Загрузите кадр с аппарата или экспорт без сильного сжатия.",
      });
    }
    const stats = await sharp(buffer, { failOn: "none" }).stats();
    if (isLikelyScreenPhoto(stats)) {
      issues.push({
        code: "flat_luminance",
        severity: "warn",
        messageRu: "Кадр может быть фото экрана или пересвечён. Переснимите без бликов или загрузите экспорт с аппарата.",
      });
    }
  } catch {
    issues.push({
      code: "decode_failed",
      severity: "block",
      messageRu: "Не удалось прочитать изображение. Проверьте файл или пересохраните в JPEG.",
    });
  }

  const blocked = issues.some((i) => i.severity === "block");
  return { ok: !blocked, issues, width, height, mime: normalizedMime };
}
