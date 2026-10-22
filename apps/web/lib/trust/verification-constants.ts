export const VERIFICATIONS_STORAGE_BUCKET = "verifications";

export const MAX_VERIFICATION_DIPLOMA_BYTES = 10 * 1024 * 1024;

export const DOCTOR_VERIFICATION_SPECIALIZATIONS = [
  "Акушер-гинеколог",
  "Врач УЗИ",
  "Рентгенолог",
  "Студент / ординатор",
] as const;

export type DoctorVerificationSpecialization = (typeof DOCTOR_VERIFICATION_SPECIALIZATIONS)[number];

export function verificationDiplomaObjectPath(userId: string, fileName: string): string {
  const safe = fileName.replace(/[^\w.\-()+]/g, "_").slice(0, 120);
  return `${userId}/${Date.now()}_${safe}`;
}
