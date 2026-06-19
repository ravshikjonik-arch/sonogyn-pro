/** Production-tunable rate limits (Vercel env). Falls back to safe defaults. */

export type RateLimitPreset = {
  limit: number;
  windowMs: number;
};

function parseLimit(envKey: string, fallback: number): number {
  const raw = process.env[envKey]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function parseWindowSec(envKey: string, fallbackSec: number): number {
  const raw = process.env[envKey]?.trim();
  if (!raw) return fallbackSec;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallbackSec;
}

function preset(
  limitKey: string,
  limitDefault: number,
  windowKey: string,
  windowDefaultSec: number,
): RateLimitPreset {
  return {
    limit: parseLimit(limitKey, limitDefault),
    windowMs: parseWindowSec(windowKey, windowDefaultSec) * 1000,
  };
}

export const RL = {
  authSignIn: preset("RATE_LIMIT_AUTH_SIGN_IN", 20, "RATE_LIMIT_AUTH_SIGN_IN_WINDOW_SEC", 900),
  authSignUp: preset("RATE_LIMIT_AUTH_SIGN_UP", 10, "RATE_LIMIT_AUTH_SIGN_UP_WINDOW_SEC", 3600),
  authPhoneSend: preset("RATE_LIMIT_AUTH_PHONE_SEND", 10, "RATE_LIMIT_AUTH_PHONE_SEND_WINDOW_SEC", 900),
  authPhoneVerify: preset(
    "RATE_LIMIT_AUTH_PHONE_VERIFY",
    20,
    "RATE_LIMIT_AUTH_PHONE_VERIFY_WINDOW_SEC",
    900,
  ),
  authFailHard: preset("RATE_LIMIT_AUTH_FAIL_MAX", 20, "RATE_LIMIT_AUTH_FAIL_WINDOW_SEC", 3600),
  authTelegram: preset("RATE_LIMIT_AUTH_TELEGRAM", 30, "RATE_LIMIT_AUTH_TELEGRAM_WINDOW_SEC", 900),
  authTelegramBot: preset(
    "RATE_LIMIT_AUTH_TELEGRAM_BOT",
    20,
    "RATE_LIMIT_AUTH_TELEGRAM_BOT_WINDOW_SEC",
    900,
  ),
  authMobileExchange: preset(
    "RATE_LIMIT_AUTH_MOBILE_EXCHANGE",
    30,
    "RATE_LIMIT_AUTH_MOBILE_EXCHANGE_WINDOW_SEC",
    900,
  ),
  patientsListIp: preset("RATE_LIMIT_PATIENTS_SEARCH", 120, "RATE_LIMIT_PATIENTS_SEARCH_WINDOW_SEC", 60),
  patientsListUser: preset(
    "RATE_LIMIT_PATIENTS_SEARCH_PER_USER",
    60,
    "RATE_LIMIT_PATIENTS_SEARCH_PER_USER_WINDOW_SEC",
    60,
  ),
  patientsCreate: preset("RATE_LIMIT_PATIENTS_CREATE", 30, "RATE_LIMIT_PATIENTS_CREATE_WINDOW_SEC", 60),
  patientsDetail: preset("RATE_LIMIT_PATIENTS_DETAIL", 120, "RATE_LIMIT_PATIENTS_DETAIL_WINDOW_SEC", 60),
  patientsUpdate: preset("RATE_LIMIT_PATIENTS_UPDATE", 60, "RATE_LIMIT_PATIENTS_UPDATE_WINDOW_SEC", 60),
  patientsDelete: preset("RATE_LIMIT_PATIENTS_DELETE", 20, "RATE_LIMIT_PATIENTS_DELETE_WINDOW_SEC", 60),
  copilotStudiesList: preset(
    "RATE_LIMIT_COPILOT_STUDIES_LIST",
    120,
    "RATE_LIMIT_COPILOT_STUDIES_LIST_WINDOW_SEC",
    60,
  ),
  copilotSeriesCreate: preset(
    "RATE_LIMIT_COPILOT_SERIES",
    40,
    "RATE_LIMIT_COPILOT_SERIES_WINDOW_SEC",
    60,
  ),
  copilotCdsPreview: preset(
    "RATE_LIMIT_COPILOT_CDS",
    20,
    "RATE_LIMIT_COPILOT_CDS_WINDOW_SEC",
    60,
  ),
  copilotImageRegister: preset(
    "RATE_LIMIT_COPILOT_IMAGE",
    60,
    "RATE_LIMIT_COPILOT_IMAGE_WINDOW_SEC",
    60,
  ),
  protocolRead: preset("RATE_LIMIT_PROTOCOL_READ", 120, "RATE_LIMIT_PROTOCOL_READ_WINDOW_SEC", 60),
  protocolWrite: preset("RATE_LIMIT_PROTOCOL_WRITE", 60, "RATE_LIMIT_PROTOCOL_WRITE_WINDOW_SEC", 60),
  aiOrads: preset("RATE_LIMIT_AI_ORADS", 40, "RATE_LIMIT_AI_ORADS_WINDOW_SEC", 60),
  aiOradsBurst: preset("RATE_LIMIT_AI_ORADS_BURST", 5, "RATE_LIMIT_AI_ORADS_BURST_WINDOW_SEC", 10),
  aiAnalyze: preset("RATE_LIMIT_AI_ANALYZE", 30, "RATE_LIMIT_AI_ANALYZE_WINDOW_SEC", 3600),
  aiStructured: preset("RATE_LIMIT_AI_STRUCTURED", 30, "RATE_LIMIT_AI_STRUCTURED_WINDOW_SEC", 60),
  aiNosology: preset("RATE_LIMIT_AI_NOSOLOGY", 40, "RATE_LIMIT_AI_NOSOLOGY_WINDOW_SEC", 60),
  aiOvary: preset("RATE_LIMIT_AI_OVARY", 40, "RATE_LIMIT_AI_OVARY_WINDOW_SEC", 60),
  evidenceAsk: preset("RATE_LIMIT_EVIDENCE_ASK", 60, "RATE_LIMIT_EVIDENCE_ASK_WINDOW_SEC", 60),
  stripeCheckout: preset("RATE_LIMIT_STRIPE_CHECKOUT", 10, "RATE_LIMIT_STRIPE_CHECKOUT_WINDOW_SEC", 60),
  stripeRestore: preset("RATE_LIMIT_STRIPE_RESTORE", 20, "RATE_LIMIT_STRIPE_RESTORE_WINDOW_SEC", 300),
  profilePatch: preset("RATE_LIMIT_PROFILE_PATCH", 60, "RATE_LIMIT_PROFILE_PATCH_WINDOW_SEC", 300),
  revokeAllSessions: preset(
    "RATE_LIMIT_REVOKE_ALL_SESSIONS",
    5,
    "RATE_LIMIT_REVOKE_ALL_SESSIONS_WINDOW_SEC",
    60,
  ),
  adminRevokeSessions: preset(
    "RATE_LIMIT_ADMIN_REVOKE_SESSIONS",
    30,
    "RATE_LIMIT_ADMIN_REVOKE_SESSIONS_WINDOW_SEC",
    60,
  ),
} as const;
