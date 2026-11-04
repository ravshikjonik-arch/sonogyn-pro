import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "sonogyn_blocked_author_ids_v1";

async function readIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

export async function listBlockedAuthorIds(): Promise<string[]> {
  return readIds();
}

export async function isAuthorBlocked(authorId: string): Promise<boolean> {
  if (!authorId) return false;
  const ids = await readIds();
  return ids.includes(authorId);
}

export async function blockAuthor(authorId: string): Promise<void> {
  if (!authorId) return;
  const ids = await readIds();
  if (ids.includes(authorId)) return;
  await AsyncStorage.setItem(KEY, JSON.stringify([...ids, authorId]));
}

export async function unblockAuthor(authorId: string): Promise<void> {
  const ids = await readIds();
  await AsyncStorage.setItem(
    KEY,
    JSON.stringify(ids.filter((id) => id !== authorId)),
  );
}
