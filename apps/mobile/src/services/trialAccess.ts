import AsyncStorage from "@react-native-async-storage/async-storage";
import { trialConfig } from "../config/trial";
import { ensureAnonymousAuth } from "./firebase/authService";
import { requireFirestore } from "./firebase/firebase";
import { doc, runTransaction } from "firebase/firestore";

const TRIAL_EXPIRES_AT_KEY = "trial_expires_at";
const TRIAL_CODE_KEY = "trial_code";

export type TrialStatus = {
  active: boolean;
  expiresAt?: number;
  daysLeft?: number;
  code?: string;
};

async function redeemOneTimeCode(code: string): Promise<number | null> {
  if (!trialConfig.useFirebaseOneTimeCodes) return null;
  try {
    const user = await ensureAnonymousAuth();
    const fs = requireFirestore();
    const ref = doc(fs, trialConfig.firebaseCollection, code);
    const days = await runTransaction(fs, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return null;
      const data = snap.data() as {
        active?: boolean;
        days?: number;
        usedBy?: string;
      };
      if (!data.active || data.usedBy) return null;
      const outDays = Number(data.days);
      if (!Number.isFinite(outDays) || outDays <= 0) return null;
      tx.update(ref, {
        active: false,
        usedBy: user.uid,
        usedAtMs: Date.now(),
      });
      return outDays;
    });
    return days;
  } catch {
    return null;
  }
}

export async function activateTrialCode(codeRaw: string): Promise<TrialStatus> {
  const code = codeRaw.trim().toUpperCase();
  const oneTimeDays = await redeemOneTimeCode(code);
  const days = oneTimeDays ?? trialConfig.fallbackCodes[code];
  if (!trialConfig.enabled || !days) {
    throw new Error("Неверный trial-код.");
  }
  const expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;
  await AsyncStorage.multiSet([
    [TRIAL_EXPIRES_AT_KEY, String(expiresAt)],
    [TRIAL_CODE_KEY, code],
  ]);
  return { active: true, expiresAt, daysLeft: days, code };
}

export async function getTrialStatus(): Promise<TrialStatus> {
  if (!trialConfig.enabled) return { active: false };
  const [expiresAtStr, code] = await AsyncStorage.multiGet([TRIAL_EXPIRES_AT_KEY, TRIAL_CODE_KEY]).then(
    (rows) => [rows[0]?.[1], rows[1]?.[1]]
  );
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return { active: false };
  }
  const daysLeft = Math.max(1, Math.ceil((expiresAt - Date.now()) / (24 * 60 * 60 * 1000)));
  return { active: true, expiresAt, daysLeft, code: code ?? undefined };
}

export async function clearTrialAccess() {
  await AsyncStorage.multiRemove([TRIAL_EXPIRES_AT_KEY, TRIAL_CODE_KEY]);
}
