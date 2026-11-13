/** Единая политика пароля SonoGyn Pro (web API + UI). */
export const AUTH_PASSWORD_MIN_LENGTH = 8 as const;
export const AUTH_PASSWORD_MAX_LENGTH = 128 as const;

export const AUTH_PASSWORD_TOO_SHORT_MSG = `Пароль слишком короткий. Минимум ${AUTH_PASSWORD_MIN_LENGTH} символов.`;
export const AUTH_PASSWORD_HINT_MSG = `Не короче ${AUTH_PASSWORD_MIN_LENGTH} символов`;

export function isPasswordLongEnough(password: string): boolean {
  return password.length >= AUTH_PASSWORD_MIN_LENGTH;
}
