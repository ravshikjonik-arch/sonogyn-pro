import AsyncStorage from "@react-native-async-storage/async-storage";
import { TERMS_ACCEPTED_KEY } from "./legacyTermsKey";

export const LEGAL_CONSENT_VERSION = 1;
export const LEGAL_CONSENT_STORAGE_KEY = `legal_consent_v${LEGAL_CONSENT_VERSION}`;

export type ConsentRecord = {
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  acceptedAiAuxiliary: boolean;
  acceptedAt: number;
  version: number;
};

export function isConsentRecord(v: unknown): v is ConsentRecord {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    o.acceptedTerms === true &&
    o.acceptedPrivacy === true &&
    o.acceptedAiAuxiliary === true &&
    typeof o.acceptedAt === "number" &&
    typeof o.version === "number"
  );
}

export async function loadConsent(): Promise<ConsentRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(LEGAL_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isConsentRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveConsent(record: Omit<ConsentRecord, "version">): Promise<void> {
  const full: ConsentRecord = {
    ...record,
    version: LEGAL_CONSENT_VERSION,
  };
  await AsyncStorage.setItem(LEGAL_CONSENT_STORAGE_KEY, JSON.stringify(full));
}

/** Users who accepted legacy single-checkbox terms before structured consent. */
export async function migrateLegacyTermsIfNeeded(): Promise<void> {
  const existing = await loadConsent();
  if (existing) return;
  try {
    const legacy = await AsyncStorage.getItem(TERMS_ACCEPTED_KEY);
    if (legacy !== "1") return;
    await saveConsent({
      acceptedTerms: true,
      acceptedPrivacy: true,
      acceptedAiAuxiliary: true,
      acceptedAt: Date.now(),
    });
  } catch {
    /* ignore */
  }
}

export async function hasValidConsent(): Promise<boolean> {
  await migrateLegacyTermsIfNeeded();
  const c = await loadConsent();
  return c !== null;
}
