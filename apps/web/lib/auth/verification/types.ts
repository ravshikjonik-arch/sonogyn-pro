/** Типы каналов доставки кодов подтверждения (152-ФЗ: не логировать contact/code). */

export type VerificationMethod = "email" | "sms" | "telegram";

export type VerificationPurpose = "register" | "login" | "mfa" | "password_reset" | "link_phone";

export type SendVerificationResult = {
  ok: boolean;
  deliveredVia?: VerificationMethod;
  fallbackUsed?: boolean;
  /** Безопасное сообщение для UI (без enumeration). */
  message?: string;
  /** Внутренний код ошибки для метрик (не PII). */
  errorCode?: string;
  suggestAlternateMethod?: VerificationMethod;
  /** Только local dev + SMS mock — показать код на экране. */
  devOtp?: string;
};

export type VerificationContact = {
  method: VerificationMethod;
  /** E.164 для SMS, email для email, chat_id для Telegram. */
  value: string;
  /** Email для fallback при SMS/Telegram. */
  fallbackEmail?: string;
};

export type StoredVerificationRecord = {
  codeHash: string;
  purpose: VerificationPurpose;
  method: VerificationMethod;
  createdAt: number;
  attempts: number;
};
