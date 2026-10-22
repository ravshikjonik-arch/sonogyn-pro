import sharp from "sharp";

/** Blur top/bottom overlay bands (typical burned-in PHI on US exports). */
export async function maskBurnedInOverlayBands(buffer: Buffer, mime: string): Promise<Buffer> {
  const normalized = mime.toLowerCase().split(";")[0]?.trim() ?? "";
  if (!normalized.startsWith("image/")) return buffer;

  const image = sharp(buffer, { failOn: "none" });
  const meta = await image.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width < 80 || height < 80) return buffer;

  const bandRows = Math.max(8, Math.floor(height * 0.12));
  const blurSigma = 14;

  const topBand = await sharp(buffer, { failOn: "none" })
    .extract({ left: 0, top: 0, width, height: bandRows })
    .blur(blurSigma)
    .toBuffer();

  const bottomBand = await sharp(buffer, { failOn: "none" })
    .extract({ left: 0, top: height - bandRows, width, height: bandRows })
    .blur(blurSigma)
    .toBuffer();

  return sharp(buffer, { failOn: "none" })
    .composite([
      { input: topBand, top: 0, left: 0 },
      { input: bottomBand, top: height - bandRows, left: 0 },
    ])
    .toBuffer();
}
