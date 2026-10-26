function blurBand(
  ctx: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  if (height < 4 || width < 4) return;
  const band = document.createElement("canvas");
  band.width = Math.max(8, Math.round(width / 28));
  band.height = Math.max(2, Math.round(height / 6));
  const bandCtx = band.getContext("2d");
  if (!bandCtx) return;
  bandCtx.drawImage(source, x, y, width, height, 0, 0, band.width, band.height);
  ctx.save();
  ctx.filter = "blur(10px)";
  ctx.drawImage(band, x, y, width, height);
  ctx.restore();
}

/** Shrink a photo and blur the header and footer, where an ultrasound overlay usually prints the patient name. */
export async function prepareOutgoingImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / bitmap.width);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  blurBand(ctx, canvas, 0, 0, width, Math.round(height * 0.14));
  const footer = Math.round(height * 0.1);
  blurBand(ctx, canvas, 0, height - footer, width, footer);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.82);
  });
  if (!blob) return file;
  const base = file.name.replace(/\.[^.]+$/, "") || "scan";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}
