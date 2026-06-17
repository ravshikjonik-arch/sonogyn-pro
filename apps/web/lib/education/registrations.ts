export const EDUCATION_REGISTRATION_STATUSES = ["new", "contacted", "confirmed", "cancelled"] as const;

export type EducationRegistrationStatus = (typeof EDUCATION_REGISTRATION_STATUSES)[number];

export const EDUCATION_REGISTRATION_STATUS_LABELS: Record<EducationRegistrationStatus, string> = {
  new: "Новая",
  contacted: "Связались",
  confirmed: "Подтверждена",
  cancelled: "Отменена",
};

export type EducationRegistration = {
  id: string;
  sessionId: string;
  sessionTitle: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  question: string | null;
  preferredSubtitleLanguage: "ru" | "en" | "es";
  status: EducationRegistrationStatus;
  createdAt: string;
  updatedAt: string;
};

type RegistrationRow = {
  id: string;
  session_id: string;
  session_title: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  question: string | null;
  preferred_subtitle_language: "ru" | "en" | "es";
  status: EducationRegistrationStatus;
  created_at: string;
  updated_at: string;
};

export function educationRegistrationFromRow(row: RegistrationRow): EducationRegistration {
  return {
    id: row.id,
    sessionId: row.session_id,
    sessionTitle: row.session_title,
    userId: row.user_id,
    fullName: row.full_name,
    email: row.email,
    question: row.question,
    preferredSubtitleLanguage: row.preferred_subtitle_language,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
