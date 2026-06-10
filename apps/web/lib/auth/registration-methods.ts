export type AuthRegistrationMethod = "email" | "phone" | "social";

export const REGISTRATION_METHOD_LABELS: Record<AuthRegistrationMethod, string> = {
  email: "Email + пароль",
  phone: "Телефон + SMS",
  social: "Google / Telegram",
};

export const REGISTRATION_METHOD_HINTS: Record<AuthRegistrationMethod, string> = {
  email: "Письмо с подтверждением на почту. Подходит, если SMS не настроен.",
  phone: "Код в SMS за ~30 сек. Нужен Twilio (или другой SMS) в Supabase.",
  social: "Быстрый вход через Google или Telegram Login.",
};

export function parseRegistrationMethod(raw: string | null): AuthRegistrationMethod {
  if (raw === "phone" || raw === "social") return raw;
  return "email";
}
