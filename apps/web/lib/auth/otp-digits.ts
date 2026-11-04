/** Единая длина OTP для email и SMS (совпадает с generateVerificationCode). */
export const AUTH_OTP_DIGITS = 6 as const;

export function normalizeOtpInput(raw: string, digits: number = AUTH_OTP_DIGITS): string {
  return raw.replace(/\D/g, "").slice(0, digits);
}

export function isCompleteOtp(raw: string, digits: number = AUTH_OTP_DIGITS): boolean {
  return normalizeOtpInput(raw, digits).length === digits;
}
