/** Справочник специализаций врача (регистрация, профиль, dev-login). */
export const DOCTOR_SPECIALIZATION_OPTIONS = [
  "Акушер-гинеколог",
  "Врач УЗИ",
  "Гинеколог",
  "Акушер",
  "Смежный специалист",
] as const;

export type DoctorSpecialization = (typeof DOCTOR_SPECIALIZATION_OPTIONS)[number];
