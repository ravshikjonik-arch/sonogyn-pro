import sharp from "sharp";

const STRIPPABLE = new Set(["image/jpeg", "image/png", "image/webp"]);

export type StripMetadataResult =
  | { ok: true; buffer: Buffer; contentType: string; stripped: boolean }
  | { ok: false; error: string };

/**
 * Remove EXIF/IPTC/XMP from raster uploads. DICOM/video pass through unchanged.
 * Does not remove burned-in pixel text (PHI) — manual anonymization still required.
 */
export async function stripImageMetadata(
  input: Buffer,
  contentType: string,
): Promise<StripMetadataResult> {
  const mime = contentType.toLowerCase().split(";")[0]?.trim() ?? "";
  if (!STRIPPABLE.has(mime)) {
    return { ok: true, buffer: input, contentType: mime || contentType, stripped: false };
  }

  try {
    const pipeline = sharp(input, { failOn: "none" }).rotate();
    let out: Buffer;
    let outMime: string;

    if (mime === "image/png") {
      out = await pipeline.png({ force: true }).toBuffer();
      outMime = "image/png";
    } else if (mime === "image/webp") {
      out = await pipeline.webp().toBuffer();
      outMime = "image/webp";
    } else {
      out = await pipeline.jpeg({ mozjpeg: true, quality: 92 }).toBuffer();
      outMime = "image/jpeg";
    }

    return { ok: true, buffer: out, contentType: outMime, stripped: true };
  } catch {
    return { ok: false, error: "Не удалось обработать изображение" };
  }
}
