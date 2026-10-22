const STORAGE_KEY = "sonogyn-cloud-stt-consent:v1";

export function hasCloudSttConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function grantCloudSttConsent(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* quota */
  }
}

export function revokeCloudSttConsent(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
