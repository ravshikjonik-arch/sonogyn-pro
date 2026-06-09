/**
 * Client-side upload validation: MIME hint + magic-byte signature.
 * Defense-in-depth before Supabase Storage upload.
 */

export const MAX_CHAT_MEDIA_BYTES = 20 * 1024 * 1024;
export const MAX_ULTRASOUND_IMAGE_BYTES = 50 * 1024 * 1024;
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export type FileValidationResult = { ok: true } | { ok: false; error: string };

function readHead(file: File, n: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(new Uint8Array(reader.result as ArrayBuffer));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file.slice(0, n));
  });
}

function bytesMatch(head: Uint8Array, sig: number[], offset = 0): boolean {
  if (head.length < offset + sig.length) return false;
  return sig.every((b, i) => head[offset + i] === b);
}

function isDicom(head: Uint8Array): boolean {
  return bytesMatch(head, [0x44, 0x49, 0x43, 0x4d], 128);
}

function detectKind(head: Uint8Array): "png" | "jpeg" | "webp" | "gif" | "dicom" | "mp4" | "webm" | null {
  if (bytesMatch(head, [0x89, 0x50, 0x4e, 0x47])) return "png";
  if (bytesMatch(head, [0xff, 0xd8, 0xff])) return "jpeg";
  if (bytesMatch(head, [0x47, 0x49, 0x46])) return "gif";
  if (bytesMatch(head, [0x52, 0x49, 0x46, 0x46]) && bytesMatch(head, [0x57, 0x45, 0x42, 0x50], 8)) return "webp";
  if (isDicom(head)) return "dicom";
  if (head.length >= 12 && bytesMatch(head, [0x66, 0x74, 0x79, 0x70], 4)) return "mp4";
  if (bytesMatch(head, [0x1a, 0x45, 0xdf, 0xa3])) return "webm";
  return null;
}

export async function validateClinicalImageUpload(
  file: File,
  maxBytes = MAX_ULTRASOUND_IMAGE_BYTES,
): Promise<FileValidationResult> {
  if (file.size <= 0) return { ok: false, error: "Пустой файл" };
  if (file.size > maxBytes) {
    return { ok: false, error: `Файл слишком большой (макс. ${Math.round(maxBytes / 1024 / 1024)} МБ)` };
  }

  const head = await readHead(file, 132);
  const kind = detectKind(head);
  if (!kind || !["png", "jpeg", "webp", "gif", "dicom"].includes(kind)) {
    return { ok: false, error: "Допустимы только изображения PNG/JPEG/WebP/GIF или DICOM" };
  }

  const type = file.type.toLowerCase();
  if (type && !type.startsWith("image/") && !type.includes("dicom")) {
    return { ok: false, error: "Недопустимый MIME-тип файла" };
  }

  return { ok: true };
}

export async function validateChatMediaUpload(file: File): Promise<FileValidationResult> {
  if (file.size <= 0) return { ok: false, error: "Пустой файл" };
  if (file.size > MAX_CHAT_MEDIA_BYTES) {
    return { ok: false, error: "Файл слишком большой (макс. 20 МБ)" };
  }

  const head = await readHead(file, 132);
  const kind = detectKind(head);
  if (!kind || !["png", "jpeg", "webp", "gif", "mp4", "webm"].includes(kind)) {
    return { ok: false, error: "Допустимы только изображения или видео MP4/WebM" };
  }

  const type = file.type.toLowerCase();
  if (type.startsWith("image/") && !["png", "jpeg", "webp", "gif"].includes(kind)) {
    return { ok: false, error: "Сигнатура файла не совпадает с типом изображения" };
  }
  if (type.startsWith("video/") && !["mp4", "webm"].includes(kind)) {
    return { ok: false, error: "Сигнатура файла не совпадает с типом видео" };
  }

  return { ok: true };
}

export async function validateAvatarUpload(file: File): Promise<FileValidationResult> {
  if (file.size <= 0) return { ok: false, error: "Пустой файл" };
  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false, error: "Аватар: макс. 5 МБ" };
  }

  const head = await readHead(file, 16);
  const kind = detectKind(head);
  if (!kind || !["png", "jpeg", "webp", "gif"].includes(kind)) {
    return { ok: false, error: "Аватар: только PNG/JPEG/WebP/GIF" };
  }

  return { ok: true };
}

const ALLOWED_REGISTER_CONTENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "application/dicom",
  "application/dicom+json",
]);

export function validateRegisteredContentType(
  contentType: string | null,
  byteSize: number | null,
): FileValidationResult {
  if (byteSize != null && byteSize > MAX_ULTRASOUND_IMAGE_BYTES) {
    return { ok: false, error: "Размер файла превышает лимит" };
  }
  if (!contentType) return { ok: true };
  const ct = contentType.toLowerCase().split(";")[0]?.trim() ?? "";
  if (!ALLOWED_REGISTER_CONTENT_TYPES.has(ct) && !ct.includes("dicom")) {
    return { ok: false, error: "Недопустимый content-type" };
  }
  return { ok: true };
}
