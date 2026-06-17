export const MAX_CASE_IMAGE_BYTES = 12 * 1024 * 1024;

export type ValidatedImageUpload = {
  blob: Blob;
  contentType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  extension: "jpg" | "png" | "webp" | "gif";
};

export type ImageValidationResult =
  | ({ ok: true } & ValidatedImageUpload)
  | { ok: false; error: string };

function bytesMatch(head: Uint8Array, sig: number[], offset = 0): boolean {
  if (head.length < offset + sig.length) return false;
  return sig.every((b, i) => head[offset + i] === b);
}

function detectImageKind(head: Uint8Array): ValidatedImageUpload["extension"] | null {
  if (bytesMatch(head, [0xff, 0xd8, 0xff])) return "jpg";
  if (bytesMatch(head, [0x89, 0x50, 0x4e, 0x47])) return "png";
  if (bytesMatch(head, [0x52, 0x49, 0x46, 0x46]) && bytesMatch(head, [0x57, 0x45, 0x42, 0x50], 8)) {
    return "webp";
  }
  if (bytesMatch(head, [0x47, 0x49, 0x46])) return "gif";
  return null;
}

function contentTypeForKind(kind: ValidatedImageUpload["extension"]): ValidatedImageUpload["contentType"] {
  if (kind === "png") return "image/png";
  if (kind === "webp") return "image/webp";
  if (kind === "gif") return "image/gif";
  return "image/jpeg";
}

async function readHead(blob: Blob): Promise<Uint8Array> {
  const head = await blob.slice(0, 16).arrayBuffer();
  return new Uint8Array(head);
}

export async function validateImageBlob(blob: Blob): Promise<ImageValidationResult> {
  if (blob.size <= 0) return { ok: false, error: "Пустой файл" };
  if (blob.size > MAX_CASE_IMAGE_BYTES) {
    return { ok: false, error: "Файл слишком большой (макс. 12 МБ)" };
  }

  const kind = detectImageKind(await readHead(blob));
  if (!kind) {
    return { ok: false, error: "Допустимы только изображения JPEG, PNG, WebP или GIF" };
  }

  return {
    ok: true,
    blob,
    contentType: contentTypeForKind(kind),
    extension: kind,
  };
}

export async function validateImageUriUpload(uri: string): Promise<ImageValidationResult> {
  const response = await fetch(uri);
  if (!response.ok) {
    return { ok: false, error: "Не удалось прочитать выбранное изображение" };
  }
  return validateImageBlob(await response.blob());
}
