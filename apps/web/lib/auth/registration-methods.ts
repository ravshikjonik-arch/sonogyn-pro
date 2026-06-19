export type AuthRegistrationMethod = "email" | "phone" | "social";

export const REGISTRATION_METHOD_LABELS: Record<AuthRegistrationMethod, string> = {
  email: "Email + пароль",
  phone: "Телефон + SMS",
  social: "Google",
};

export const REGISTRATION_METHOD_HINTS: Record<AuthRegistrationMethod, string> = {
  email: "Письмо с подтверждением на почту. Подходит, если SMS ещё не подключён.",
  phone: "Код в SMS за ~30 сек. Для РФ — SMS.ru (ожидаем одобрение регистрации).",
  social: "Быстрый вход через Google-аккаунт.",
};

export function parseRegistrationMethod(raw: string | null): AuthRegistrationMethod {
  if (raw === "phone" || raw === "social") return raw;
  return "email";
}
