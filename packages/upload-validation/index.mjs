/** Node ESM entry (mobile chat server). Logic synced with src/index.ts */
export const MAX_CASE_IMAGE_BYTES = 12 * 1024 * 1024;

function bytesMatch(head, sig, offset = 0) {
  if (head.length < offset + sig.length) return false;
  return sig.every((b, i) => head[offset + i] === b);
}

function detectClinicalImageKind(head) {
  if (bytesMatch(head, [0x89, 0x50, 0x4e, 0x47])) return "png";
  if (bytesMatch(head, [0xff, 0xd8, 0xff])) return "jpeg";
  if (bytesMatch(head, [0x47, 0x49, 0x46])) return "gif";
  if (bytesMatch(head, [0x52, 0x49, 0x46, 0x46]) && bytesMatch(head, [0x57, 0x45, 0x42, 0x50], 8)) {
    return "webp";
  }
  return null;
}

export function validateClinicalImageBuffer(buffer, maxBytes = MAX_CASE_IMAGE_BYTES) {
  if (!buffer?.length) return { ok: false, error: "Пустой файл" };
  if (buffer.length > maxBytes) {
    return { ok: false, error: `Файл слишком большой (макс. ${Math.round(maxBytes / 1024 / 1024)} МБ)` };
  }
  const kind = detectClinicalImageKind(buffer);
  if (!kind) return { ok: false, error: "Допустимы только PNG/JPEG/WebP/GIF" };
  return { ok: true, kind };
}

export function extensionForKind(kind) {
  if (kind === "png") return "png";
  if (kind === "webp") return "webp";
  if (kind === "gif") return "gif";
  return "jpg";
}
