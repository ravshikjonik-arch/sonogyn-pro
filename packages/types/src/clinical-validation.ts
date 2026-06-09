import { z } from "zod";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Calendar-valid YYYY-MM-DD (local calendar, no timezone shift). */
export function isValidIsoCalendarDate(iso: string): boolean {
  if (!ISO_DATE_RE.test(iso)) return false;
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7));
  const d = Number(iso.slice(8, 10));
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export function validateSnilsChecksum(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 11 || digits.startsWith("000")) return false;
  const control = Number.parseInt(digits.slice(9, 11), 10);
  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += Number.parseInt(digits[i]!, 10) * (9 - i);
  }
  let check = sum % 101;
  if (check === 100) check = 0;
  return check === control;
}

/** Only safe raster data URLs for embedded clinical snapshots. */
export function isSafeClinicalImageDataUrl(value: string): boolean {
  const v = value.trim();
  if (!v.startsWith("data:image/")) return false;
  if (v.length > 2_000_000) return false;
  return /^data:image\/(png|jpeg|jpg|webp);base64,[a-zA-Z0-9+/=\s]+$/.test(v);
}

export function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeLikePattern(raw: string): string {
  return raw.replace(/[\\%_]/g, (m) => `\\${m}`);
}

const noControlChars = (s: string) => !/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(s);

export function isPlainClinicalText(s: string): boolean {
  return noControlChars(s);
}

export function clinicalPlainText(maxLen: number) {
  return z
    .string()
    .max(maxLen)
    .refine(noControlChars, "Недопустимые управляющие символы");
}

export const ClinicalPlainTextSchema = clinicalPlainText(8000);

export const IsoDateStringSchema = z
  .string()
  .regex(ISO_DATE_RE, "Дата: формат YYYY-MM-DD")
  .refine(isValidIsoCalendarDate, "Некорректная дата");

export const OptionalIsoDateStringSchema = IsoDateStringSchema.optional();

export const ClinicalPhoneSchema = z.preprocess(
  (v) => {
    if (v === undefined || v === null || v === "") return undefined;
    if (typeof v !== "string") return v;
    const t = v.trim();
    return t.startsWith("+") ? t : `+${t.replace(/\D/g, "")}`;
  },
  z
    .string()
    .max(16)
    .regex(/^\+[1-9]\d{7,14}$/, "Телефон: +79001234567")
    .optional(),
);

export const SnilsSchema = z.preprocess(
  (v) => {
    if (v === undefined || v === null || v === "") return undefined;
    if (typeof v !== "string") return v;
    return v.replace(/\D/g, "");
  },
  z
    .string()
    .regex(/^\d{11}$/, "СНИЛС: 11 цифр")
    .refine(validateSnilsChecksum, "Неверная контрольная сумма СНИЛС")
    .optional(),
);

export const OmsPolicyNumberSchema = z.preprocess(
  (v) => {
    if (v === undefined || v === null || v === "") return undefined;
    if (typeof v !== "string") return v;
    return v.replace(/\D/g, "");
  },
  z
    .string()
    .regex(/^\d{16}$/, "Полис ОМС: 16 цифр")
    .optional(),
);

export const ExternalRefSchema = z
  .string()
  .max(120)
  .regex(/^[\p{L}\p{N}\-_.\/\s]+$/u, "Номер карты: буквы, цифры, - _ . /")
  .optional();

export const ExternalMrnSchema = z
  .string()
  .max(64)
  .regex(/^[\p{L}\p{N}\-_.]+$/u, "MRN: буквы, цифры, - _ .")
  .optional();

export const SafeSnapshotDataUrlSchema = z
  .string()
  .max(2_000_000)
  .refine(isSafeClinicalImageDataUrl, "Недопустимый формат снимка (только PNG/JPEG/WebP base64)");
