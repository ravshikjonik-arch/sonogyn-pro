import { useCallback, useState } from "react";

import { supabaseMobile } from "../lib/supabase/mobileClient";

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("8") && digits.length === 11) return `+7${digits.slice(1)}`;
  if (digits.startsWith("7") && digits.length === 11) return `+${digits}`;
  if (raw.trim().startsWith("+")) return `+${digits}`;
  return raw.trim();
}

function translatePhoneError(message: string): string {
  if (/invalid otp|otp_expired/i.test(message)) return "Неверный или просроченный код.";
  if (/phone.*invalid/i.test(message)) return "Неверный формат номера. Используйте +79001234567.";
  if (/too many requests|rate/i.test(message)) return "Слишком много попыток. Подождите.";
  if (/user not found|invalid login credentials/i.test(message)) return "Неверные учётные данные.";
  return "Не удалось выполнить вход по телефону. Проверьте номер и попробуйте снова.";
}

export function usePhoneAuth() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendOtp = useCallback(async (createUser = false) => {
    if (!supabaseMobile) {
      setError("Supabase не настроен (EXPO_PUBLIC_SUPABASE_URL / ANON_KEY).");
      return false;
    }

    setBusy(true);
    setError(null);
    try {
      const normalized = normalizePhone(phone);
      const { error: otpError } = await supabaseMobile.auth.signInWithOtp({
        phone: normalized,
        options: createUser ? { shouldCreateUser: true } : undefined,
      });
      if (otpError) {
        setError(translatePhoneError(otpError.message));
        return false;
      }
      setOtpSent(true);
      return true;
    } finally {
      setBusy(false);
    }
  }, [phone]);

  const verifyOtp = useCallback(async () => {
    if (!supabaseMobile) {
      setError("Supabase не настроен.");
      return false;
    }

    setBusy(true);
    setError(null);
    try {
      const normalized = normalizePhone(phone);
      const { error: verifyError } = await supabaseMobile.auth.verifyOtp({
        phone: normalized,
        token: otp.trim(),
        type: "sms",
      });
      if (verifyError) {
        setError(translatePhoneError(verifyError.message));
        return false;
      }
      return true;
    } finally {
      setBusy(false);
    }
  }, [otp, phone]);

  return {
    phone,
    setPhone,
    otp,
    setOtp,
    otpSent,
    setOtpSent,
    busy,
    error,
    setError,
    sendOtp,
    verifyOtp,
  };
}
