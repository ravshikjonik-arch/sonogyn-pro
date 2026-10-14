import type { SupabaseClient } from "@supabase/supabase-js";

import {
  canTransitionLifecycle,
  type CaseLifecycleAction,
  type CaseLifecycleTransitionBody,
} from "@repo/types";

import { safeLog } from "@/lib/security/safeLog";

export type LifecycleTransitionInput = CaseLifecycleTransitionBody & {
  caseId: string;
  requestId: string;
  idempotencyKey?: string | null;
};

export type LifecycleTransitionResult =
  | { ok: true; action: CaseLifecycleAction; duplicate?: boolean }
  | { ok: false; status: number; error: string; code?: string };

export function validateLifecycleTransitionBody(
  body: CaseLifecycleTransitionBody,
): LifecycleTransitionResult | null {
  if (body.action === "confirm") {
    if (!body.confirmationMethod) {
      return { ok: false, status: 400, error: "Укажите метод подтверждения.", code: "confirmation_method_required" };
    }
    if (body.confirmationMethod === "other" && !body.confirmationMethodOther?.trim()) {
      return {
        ok: false,
        status: 400,
        error: "Укажите пояснение для метода «другое».",
        code: "confirmation_method_other_required",
      };
    }
    const diagnosis = body.confirmedDiagnosis?.trim() ?? "";
    if (diagnosis.length < 3) {
      return {
        ok: false,
        status: 400,
        error: "Укажите содержательное подтверждённое заключение (минимум 3 символа).",
        code: "confirmed_diagnosis_required",
      };
    }
  }
  return null;
}

/** Server-side pre-check before RPC (RPC remains source of truth). */
export function assertLifecycleTransitionAllowed(
  currentStatus: string,
  action: CaseLifecycleAction,
): LifecycleTransitionResult | null {
  const from = currentStatus as Parameters<typeof canTransitionLifecycle>[0];
  if (!canTransitionLifecycle(from, action) && action !== "publish_knowledge_base") {
    return {
      ok: false,
      status: 400,
      error: "Недопустимый переход статуса",
      code: "invalid_transition",
    };
  }
  return null;
}

export async function transitionCaseLifecycle(
  supabase: SupabaseClient,
  input: LifecycleTransitionInput,
): Promise<LifecycleTransitionResult> {
  const validationError = validateLifecycleTransitionBody(input);
  if (validationError) return validationError;

  const { error } = await supabase.rpc("transition_case_lifecycle", {
    p_case_id: input.caseId,
    p_action: input.action,
    p_confirmation_method: input.confirmationMethod ?? null,
    p_confirmation_method_other: input.confirmationMethodOther ?? null,
    p_confirmed_diagnosis: input.confirmedDiagnosis ?? null,
    p_note: input.note ?? null,
    p_request_id: input.requestId,
    p_idempotency_key: input.idempotencyKey ?? null,
  });

  if (error) {
    safeLog("case lifecycle transition error", {
      code: error.code,
      message: error.message,
      requestId: input.requestId,
      caseId: input.caseId,
      action: input.action,
    });

    if (error.message.includes("idempotent replay")) {
      return { ok: true, action: input.action, duplicate: true };
    }
    if (error.message.includes("forbidden")) {
      return { ok: false, status: 403, error: "Недостаточно прав для этого действия", code: "forbidden" };
    }
    if (error.message.includes("invalid transition")) {
      return { ok: false, status: 400, error: "Недопустимый переход статуса", code: "invalid_transition" };
    }
    return { ok: false, status: 400, error: "Не удалось изменить статус", code: error.code };
  }

  if (input.action === "publish_knowledge_base") {
    const { error: linkError } = await supabase.rpc("sync_teaching_case_knowledge_links", {
      p_case_id: input.caseId,
    });
    if (linkError) {
      safeLog("teaching case knowledge link sync warning", {
        message: linkError.message,
        code: linkError.code,
        requestId: input.requestId,
        caseId: input.caseId,
      });
    }
  }

  return { ok: true, action: input.action };
}
