const MAX_LONG_EDGE = 1568;
const JPEG_QUALITY = 0.85;

export const SONOGYN_IMAGE_ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const SONOGYN_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export type PreparedChatImage = {
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  data: string;
  previewUrl: string;
};

export function validateChatImageFile(file: File): string | null {
  if (!SONOGYN_IMAGE_ACCEPT.includes(file.type as (typeof SONOGYN_IMAGE_ACCEPT)[number])) {
    return "Поддерживаются JPEG, PNG, WebP и GIF.";
  }
  if (file.size > SONOGYN_IMAGE_MAX_BYTES) {
    return "Файл больше 5 МБ. Выберите снимок меньшего размера.";
  }
  return null;
}

/** Resize на клиенте — длинная сторона ≤ 1568 px, затем base64 */
export async function prepareChatImage(file: File): Promise<PreparedChatImage> {
  const err = validateChatImageFile(file);
  if (err) throw new Error(err);

  if (file.type === "image/gif") {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
    return {
      mediaType: "image/gif",
      data: btoa(binary),
      previewUrl: URL.createObjectURL(file),
    };
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_LONG_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas недоступен");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY),
  );
  if (!blob) throw new Error("Не удалось сжать изображение");

  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);

  return {
    mediaType: "image/jpeg",
    data: btoa(binary),
    previewUrl: URL.createObjectURL(blob),
  };
}
