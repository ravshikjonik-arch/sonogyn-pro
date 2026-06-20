import { isAuthEmailOnly } from "@/lib/auth/auth-methods-config";

export type AuthRegistrationMethod = "email" | "phone" | "social";

export const REGISTRATION_METHOD_LABELS: Record<AuthRegistrationMethod, string> = {
  email: "Email + пароль",
  phone: "Телефон + SMS",
  social: "Google",
};

export const REGISTRATION_METHOD_HINTS: Record<AuthRegistrationMethod, string> = {
  email: "Письмо с подтверждением на почту. Работает из РФ без VPN.",
  phone: "Код по SMS (sms.ru с сервера). VPN не нужен — SMS идёт на ваш номер.",
  social: "Google OAuth. Если Google недоступен — вкладки «Почта» или «Телефон».",
};

export function parseRegistrationMethod(raw: string | null): AuthRegistrationMethod {
  if (isAuthEmailOnly()) return "email";
  if (raw === "phone" || raw === "social") return raw;
  return "email";
}
