import { createServiceRoleClient } from "@/utils/supabase/admin";

import { detectPhi, detectPhiInUnknown, PHI_BLOCK_MESSAGE } from "./phi-detection";
import { safeLog } from "./safeLog";
import { writeSecurityAuditLog } from "./security-audit-log";

/** Legacy / forbidden patient meta keys — must not be sent on create/update. */
export const FORBIDDEN_PATIENT_META_KEYS = [
  "date_of_birth",
  "phone",
  "email",
  "snils",
  "oms_policy",
  "external_mrn",
] as const;

export const PHI_ACCOUNT_BAN_MESSAGE =
  "Персональные данные пациентов на платформе запрещены. Аккаунт заблокирован за нарушение правил SonoGyn Pro.";

export type PatientPhiPayload = {
  display_label?: string;
  external_ref?: string | null;
  meta?: unknown;
};

export type PatientPhiAssessment =
  | { ok: true }
  | { ok: false; reasons: string[]; ban: boolean };

function collectForbiddenMetaKeys(meta: unknown): string[] {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return [];
  return FORBIDDEN_PATIENT_META_KEYS.filter((key) =>
    Object.prototype.hasOwnProperty.call(meta, key),
  ).map((key) => `поле meta.${key}`);
}

export function assessPatientPhiPayload(payload: PatientPhiPayload): PatientPhiAssessment {
  const reasons: string[] = [];

  if (payload.external_ref != null && String(payload.external_ref).trim()) {
    reasons.push("номер карты (external_ref)");
  }

  reasons.push(...collectForbiddenMetaKeys(payload.meta));

  if (payload.display_label?.trim()) {
    const labelCheck = detectPhi(payload.display_label);
    if (!labelCheck.ok) reasons.push(...labelCheck.reasons.map((r) => `метка: ${r}`));
  }

  if (payload.meta !== undefined) {
    const metaCheck = detectPhiInUnknown(payload.meta);
    if (!metaCheck.ok) reasons.push(...metaCheck.reasons.map((r) => `meta: ${r}`));
  }

  const unique = [...new Set(reasons)];
  if (unique.length === 0) return { ok: true };

  return { ok: false, reasons: unique, ban: true };
}

export function patientPhiRejectMessage(reasons: string[]): string {
  if (reasons.length === 0) return PHI_BLOCK_MESSAGE;
  return `${PHI_BLOCK_MESSAGE} Обнаружено: ${reasons.join(", ")}.`;
}

/** Auto-suspend account after PHI violation (service role). Best-effort if key missing. */
export async function suspendAccountForPhiViolation(
  userId: string,
  reasons: string[],
): Promise<void> {
  await writeSecurityAuditLog({
    category: "moderation",
    action: "patient_phi.violation",
    resource: "profiles",
    resourceId: userId,
    success: false,
    metadata: { reasons },
  });

  try {
    const admin = createServiceRoleClient();
    const { error } = await admin
      .from("profiles")
      .update({
        medical_access_status: "suspended",
        medical_verification_note: `Автоблок: попытка сохранить ПДн пациента (${reasons.slice(0, 3).join(", ")})`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      safeLog("patient phi suspend failed", { code: error.code, userId: userId.slice(0, 8) });
      return;
    }

    await writeSecurityAuditLog({
      category: "moderation",
      action: "patient_phi.account_suspended",
      resource: "profiles",
      resourceId: userId,
      metadata: { reasons },
    });
  } catch (err) {
    safeLog("patient phi suspend unavailable", {
      message: err instanceof Error ? err.message : "unknown",
    });
  }
}
