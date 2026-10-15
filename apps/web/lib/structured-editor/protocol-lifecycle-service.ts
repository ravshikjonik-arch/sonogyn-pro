import type { SupabaseClient } from "@supabase/supabase-js";

import {
  type ProtocolLifecycleAction,
  type ProtocolLifecycleTransitionBody,
} from "@repo/types";

import { computeProtocolContentHash } from "@/lib/structured-editor/protocol-content-hash";
import { safeLog } from "@/lib/security/safeLog";

export type ProtocolLifecycleInput = ProtocolLifecycleTransitionBody & {
  studyId: string;
  requestId: string;
  idempotencyKey?: string | null;
  draftForHash?: Parameters<typeof computeProtocolContentHash>[0];
};

export type ProtocolLifecycleResult =
  | { ok: true; action: ProtocolLifecycleAction; duplicate?: boolean; contentHash?: string }
  | { ok: false; status: number; error: string; code?: string };

export function validateProtocolLifecycleBody(
  body: ProtocolLifecycleTransitionBody,
): ProtocolLifecycleResult | null {
  if (body.action === "amend") {
    const reason = body.amendmentReason?.trim() ?? "";
    if (reason.length < 3) {
      return {
        ok: false,
        status: 400,
        error: "Укажите причину исправления (минимум 3 символа).",
        code: "amendment_reason_required",
      };
    }
  }
  return null;
}

export async function transitionProtocolLifecycle(
  supabase: SupabaseClient,
  input: ProtocolLifecycleInput,
): Promise<ProtocolLifecycleResult> {
  const validationError = validateProtocolLifecycleBody(input);
  if (validationError) return validationError;

  let contentHash: string | null = null;
  if (input.action === "finalize") {
    if (!input.draftForHash) {
      return {
        ok: false,
        status: 400,
        error: "Не удалось вычислить хеш содержимого.",
        code: "content_hash_required",
      };
    }
    contentHash = computeProtocolContentHash(input.draftForHash);
  }

  const { error } = await supabase.rpc("transition_protocol_structured_lifecycle", {
    p_study_id: input.studyId,
    p_action: input.action,
    p_content_hash: contentHash,
    p_amendment_reason: input.amendmentReason ?? null,
    p_request_id: input.requestId,
    p_idempotency_key: input.idempotencyKey ?? null,
  });

  if (error) {
    safeLog("protocol lifecycle error", {
      code: error.code,
      message: error.message,
      studyId: input.studyId,
      action: input.action,
      requestId: input.requestId,
    });

    if (error.message.includes("idempotent replay")) {
      return { ok: true, action: input.action, duplicate: true, contentHash: contentHash ?? undefined };
    }
    if (error.message.includes("forbidden") || error.message.includes("cannot be modified")) {
      return { ok: false, status: 403, error: "Протокол заблокирован для редактирования", code: "forbidden" };
    }
    if (error.message.includes("physician confirmation")) {
      return {
        ok: false,
        status: 400,
        error: "Подтвердите заключение врачом перед финализацией.",
        code: "physician_confirmation_required",
      };
    }
    if (error.message.includes("invalid transition")) {
      return { ok: false, status: 400, error: "Недопустимый переход статуса протокола", code: "invalid_transition" };
    }
    return { ok: false, status: 400, error: "Не удалось изменить статус протокола", code: error.code };
  }

  return { ok: true, action: input.action, contentHash: contentHash ?? undefined };
}
