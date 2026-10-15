import { NextResponse } from "next/server";
import { z } from "zod";

import { ProtocolLifecycleTransitionBodySchema } from "@repo/types";

import { resolveIdempotencyKey, resolveRequestId, withRequestIdHeaders } from "@/lib/api/request-context";
import {
  getProtocolStructuredDraft,
} from "@/lib/structured-editor/protocol-structured-service";
import {
  transitionProtocolLifecycle,
  validateProtocolLifecycleBody,
} from "@/lib/structured-editor/protocol-lifecycle-service";
import { rejectIfRateLimitedPreset, rejectIfSyncBurstForUser } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { assertStudyOwnedByUser } from "@/lib/security/assert-study-owner";
import { isUuid } from "@/lib/security/uuid";
import { createClient } from "@/utils/supabase/server";

export async function PATCH(request: Request, context: { params: Promise<{ studyId: string }> }) {
  const requestId = resolveRequestId(request);
  const limited = await rejectIfRateLimitedPreset(request, "protocol-lifecycle", RL.protocolWrite);
  if (limited) return limited;

  const { studyId } = await context.params;
  if (!isUuid(studyId)) {
    return NextResponse.json({ error: "Not found", requestId }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401 });

  const burst = await rejectIfSyncBurstForUser(user.id);
  if (burst) return burst;

  const owned = await assertStudyOwnedByUser(supabase, studyId, user.id);
  if (!owned) return NextResponse.json({ error: "Not found", requestId }, { status: 404 });

  const json = await request.json().catch(() => null);
  const parsed = ProtocolLifecycleTransitionBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten(), requestId },
      { status: 400, headers: withRequestIdHeaders(requestId) },
    );
  }

  const validationError = validateProtocolLifecycleBody(parsed.data);
  if (validationError && !validationError.ok) {
    return NextResponse.json(
      { error: validationError.error, code: validationError.code, requestId },
      { status: validationError.status, headers: withRequestIdHeaders(requestId) },
    );
  }

  let draftForHash: Awaited<ReturnType<typeof getProtocolStructuredDraft>>["draft"] = null;
  if (parsed.data.action === "finalize") {
    const loaded = await getProtocolStructuredDraft(supabase, studyId);
    draftForHash = loaded.draft;
    if (!draftForHash) {
      return NextResponse.json(
        { error: "Черновик не найден", requestId },
        { status: 404, headers: withRequestIdHeaders(requestId) },
      );
    }
  }

  const result = await transitionProtocolLifecycle(supabase, {
    ...parsed.data,
    studyId,
    requestId,
    idempotencyKey: resolveIdempotencyKey(request),
    draftForHash: draftForHash ?? undefined,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code, requestId },
      { status: result.status, headers: withRequestIdHeaders(requestId) },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      action: result.action,
      duplicate: result.duplicate ?? false,
      contentHash: result.contentHash,
      requestId,
    },
    { headers: withRequestIdHeaders(requestId) },
  );
}
