import { useCallback, useState } from "react";

import { sendPhoneOtpViaApi, verifyPhoneOtpViaApi } from "../lib/auth/emailAuthApi";
import { supabaseMobile } from "../lib/supabase/mobileClient";

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("8") && digits.length === 11) return `+7${digits.slice(1)}`;
  if (digits.startsWith("7") && digits.length === 11) return `+${digits}`;
  if (raw.trim().startsWith("+")) return `+${digits}`;
  return raw.trim();
}

export function usePhoneAuth() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresCaptcha, setRequiresCaptcha] = useState(false);

  const sendOtp = useCallback(async (createUser = false, turnstileToken?: string) => {
    if (!supabaseMobile) {
      setError("Supabase не настроен (EXPO_PUBLIC_SUPABASE_URL / ANON_KEY).");
      return false;
    }

    setBusy(true);
    setError(null);
    try {
      const normalized = normalizePhone(phone);
      const result = await sendPhoneOtpViaApi(normalized, createUser, turnstileToken);
      if (!result.ok) {
        setRequiresCaptcha(Boolean(result.requiresCaptcha));
        setError(result.error);
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
      const result = await verifyPhoneOtpViaApi(normalized, otp.trim());
      if (!result.ok) {
        setError(result.error);
        return false;
      }
      if (result.session) {
        await supabaseMobile.auth.setSession(result.session);
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
    requiresCaptcha,
    sendOtp,
    verifyOtp,
  };
}
