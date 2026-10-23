/**
 * Doctor chat v2 rollout (Telegram-like sync, outbox, cursor history).
 * Default: off — enable on staging first, then prod slice.
 */

function envTruthy(value: string | undefined): boolean {
  const v = value?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export function isDoctorChatV2Enabled(): boolean {
  return envTruthy(process.env.DOCTOR_CHAT_V2_ENABLED);
}

export function isDoctorChatV2EnabledClient(): boolean {
  return (
    envTruthy(process.env.NEXT_PUBLIC_DOCTOR_CHAT_V2_ENABLED) ||
    envTruthy(process.env.DOCTOR_CHAT_V2_ENABLED)
  );
}

/** @AI / @ИИ tutor hint in doctor chat v2 (default on unless explicitly disabled). */
export function isDoctorChatAiMentionEnabled(): boolean {
  const off =
    envTruthy(process.env.DOCTOR_CHAT_AI_MENTION_DISABLED) ||
    envTruthy(process.env.NEXT_PUBLIC_DOCTOR_CHAT_AI_MENTION_DISABLED);
  if (off) return false;
  return envTruthy(process.env.DOCTOR_CHAT_AI_MENTION_ENABLED) || envTruthy(process.env.NEXT_PUBLIC_DOCTOR_CHAT_AI_MENTION_ENABLED) || isDoctorChatV2Enabled();
}

/** Browser Web Push for doctor chat (needs VAPID + migration web_push_subscriptions). */
export function isDoctorChatWebPushEnabled(): boolean {
  return envTruthy(process.env.DOCTOR_CHAT_WEB_PUSH_ENABLED);
}

export function isDoctorChatWebPushEnabledClient(): boolean {
  return (
    envTruthy(process.env.NEXT_PUBLIC_DOCTOR_CHAT_WEB_PUSH_ENABLED) ||
    envTruthy(process.env.DOCTOR_CHAT_WEB_PUSH_ENABLED)
  );
}

export function getWebPushVapidPublicKeyClient(): string | null {
  const key =
    process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY?.trim() ||
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  return key || null;
}

export function isDoctorChatAiMentionEnabledClient(): boolean {
  const off = envTruthy(process.env.NEXT_PUBLIC_DOCTOR_CHAT_AI_MENTION_DISABLED);
  if (off) return false;
  return (
    envTruthy(process.env.NEXT_PUBLIC_DOCTOR_CHAT_AI_MENTION_ENABLED) ||
    isDoctorChatV2EnabledClient()
  );
}
