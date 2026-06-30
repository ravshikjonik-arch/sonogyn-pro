import { put } from "@vercel/blob";

const PRIVATE_STORE_HINT = [
  "Blob store «sonogyn-lessons» — private.",
  "Обновите токен: Vercel Dashboard → Storage → sonogyn-lessons → .env.local",
  "  или: cd apps/web && npx vercel env pull .env.local",
  "Загрузка только с access: private (не public).",
].join("\n");

/**
 * Upload to Vercel Blob (private store). Never uses public access.
 */
export async function putPrivateBlob(pathname, body, { token, contentType, addRandomSuffix = false } = {}) {
  if (!token?.trim()) {
    throw new Error("BLOB_READ_WRITE_TOKEN не задан в .env.local");
  }

  try {
    return await put(pathname, body, {
      access: "private",
      token: token.trim(),
      contentType,
      addRandomSuffix,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/public access.*private store/i.test(msg)) {
      throw new Error(`${msg}\n\n${PRIVATE_STORE_HINT}`);
    }
    throw err;
  }
}
