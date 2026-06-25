export const MAX_CLINICAL_IMAGE_BYTES = 50 * 1024 * 1024;
export const MAX_CASE_IMAGE_BYTES = 12 * 1024 * 1024;

export type UploadValidationResult = { ok: true } | { ok: false; error: string };

export type ClinicalImageKind = "png" | "jpeg" | "webp" | "gif";

function bytesMatch(head: Uint8Array, sig: number[], offset = 0): boolean {
  if (head.length < offset + sig.length) return false;
  return sig.every((b, i) => head[offset + i] === b);
}

export function detectClinicalImageKind(head: Uint8Array): ClinicalImageKind | null {
  if (bytesMatch(head, [0x89, 0x50, 0x4e, 0x47])) return "png";
  if (bytesMatch(head, [0xff, 0xd8, 0xff])) return "jpeg";
  if (bytesMatch(head, [0x47, 0x49, 0x46])) return "gif";
  if (bytesMatch(head, [0x52, 0x49, 0x46, 0x46]) && bytesMatch(head, [0x57, 0x45, 0x42, 0x50], 8)) {
    return "webp";
  }
  return null;
}

export function validateClinicalImageBuffer(
  buffer: Uint8Array,
  maxBytes = MAX_CLINICAL_IMAGE_BYTES,
): UploadValidationResult {
  if (buffer.length <= 0) return { ok: false, error: "Пустой файл" };
  if (buffer.length > maxBytes) {
    return { ok: false, error: `Файл слишком большой (макс. ${Math.round(maxBytes / 1024 / 1024)} МБ)` };
  }
  const kind = detectClinicalImageKind(buffer);
  if (!kind) {
    return { ok: false, error: "Допустимы только изображения PNG/JPEG/WebP/GIF" };
  }
  return { ok: true };
}

/** React Native / Expo: validate local file URI before Firebase upload. */
export async function validateClinicalImageUri(
  uri: string,
  maxBytes = MAX_CLINICAL_IMAGE_BYTES,
): Promise<UploadValidationResult> {
  try {
    const response = await fetch(uri);
    if (!response.ok) return { ok: false, error: "Не удалось прочитать файл" };
    const blob = await response.blob();
    if (blob.size > maxBytes) {
      return { ok: false, error: `Файл слишком большой (макс. ${Math.round(maxBytes / 1024 / 1024)} МБ)` };
    }
    const slice = blob.slice(0, 16);
    const buffer = new Uint8Array(await slice.arrayBuffer());
    return validateClinicalImageBuffer(buffer, maxBytes);
  } catch {
    return { ok: false, error: "Не удалось проверить файл" };
  }
}

export function extensionForClinicalKind(kind: ClinicalImageKind): string {
  switch (kind) {
    case "png":
      return "png";
    case "webp":
      return "webp";
    case "gif":
      return "gif";
    default:
      return "jpg";
  }
}
