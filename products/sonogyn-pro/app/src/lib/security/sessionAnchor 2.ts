import AsyncStorage from "@react-native-async-storage/async-storage";

export const SESSION_ANCHOR_KEY = "sonogyn_session_anchor_v1";

export async function markSessionAnchorNow(): Promise<void> {
  try {
    await AsyncStorage.setItem(SESSION_ANCHOR_KEY, String(Date.now()));
  } catch {
    /* storage full */
  }
}

export async function readSessionAnchor(): Promise<number> {
  const raw = await AsyncStorage.getItem(SESSION_ANCHOR_KEY);
  const n = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n > 0 ? n : 0;
}
