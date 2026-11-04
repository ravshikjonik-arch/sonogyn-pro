/**
 * Client-side resize/compress before POST /api/ai/*-assist.
 * Phone photos as raw base64 often exceed Vercel request body (~4.5 MB) → HTTP 413.
 */

const MAX_LONG_EDGE = 1280;
const JPEG_QUALITY = 0.78;
/** Soft cap on resulting base64 length (~2.4 MB binary). */
const MAX_BASE64_CHARS = 3_200_000;

export type ClientImagingFrame = {
  fileName: string;
  mimeType: string;
  base64: string;
  previewUrl: string;
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  return bytesToBase64(new Uint8Array(buf));
}

async function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!blob) throw new Error("Не удалось сжать изображение");
  return blob;
}

/**
 * Resize to ≤1280 long edge, JPEG compress; returns frame ready for assist APIs.
 */
export async function prepareClientImagingFrame(file: File): Promise<ClientImagingFrame> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Нужен файл изображения (PNG/JPEG/WebP)");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_LONG_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Canvas недоступен");
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  let quality = JPEG_QUALITY;
  let blob = await canvasToJpegBlob(canvas, quality);
  let base64 = await blobToBase64(blob);

  // Tighten quality if still too large for serverless body
  while (base64.length > MAX_BASE64_CHARS && quality > 0.45) {
    quality -= 0.1;
    blob = await canvasToJpegBlob(canvas, quality);
    base64 = await blobToBase64(blob);
  }

  if (base64.length > MAX_BASE64_CHARS) {
    throw new Error("Снимок слишком большой даже после сжатия. Обрежьте кадр или уменьшите разрешение.");
  }

  const baseName = file.name.replace(/\.[^.]+$/, "") || "ultrasound";
  return {
    fileName: `${baseName}.jpg`,
    mimeType: "image/jpeg",
    base64,
    previewUrl: URL.createObjectURL(blob),
  };
}

export function assistHttpErrorMessage(status: number, serverError?: string): string {
  if (status === 413) {
    return "Снимок слишком большой для сервера (HTTP 413). Мы сжимаем фото автоматически — попробуйте ещё раз или выберите кадр меньшего размера.";
  }
  return serverError ?? `HTTP ${status}`;
}
