import { NextResponse } from "next/server";
import { z } from "zod";

import { CaseLifecycleTransitionBodySchema } from "@repo/types";

import { resolveIdempotencyKey, resolveRequestId, withRequestIdHeaders } from "@/lib/api/request-context";
import {
  transitionCaseLifecycle,
  validateLifecycleTransitionBody,
} from "@/lib/cases/lifecycle-service";
import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

type Params = { params: Promise<{ caseId: string }> };

const ParamsSchema = z.object({ caseId: z.string().uuid() });

export async function PATCH(request: Request, { params }: Params) {
  const requestId = resolveRequestId(request);
  const limited = await rejectIfRateLimitedPreset(request, "case-lifecycle", RL.syncBurst);
  if (limited) return limited;

  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json(
      { error: routeParams.error.flatten(), requestId },
      { status: 400, headers: withRequestIdHeaders(requestId) },
    );
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "case-lifecycle", RL.syncBurst);
  if (userRl) return userRl;

  const json = await request.json().catch(() => null);
  const parsed = CaseLifecycleTransitionBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten(), requestId },
      { status: 400, headers: withRequestIdHeaders(requestId) },
    );
  }

  const validationError = validateLifecycleTransitionBody(parsed.data);
  if (validationError && !validationError.ok) {
    return NextResponse.json(
      { error: validationError.error, code: validationError.code, requestId },
      { status: validationError.status, headers: withRequestIdHeaders(requestId) },
    );
  }

  const result = await transitionCaseLifecycle(supabase, {
    ...parsed.data,
    caseId: routeParams.data.caseId,
    requestId,
    idempotencyKey: resolveIdempotencyKey(request),
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, code: result.code, requestId },
      { status: result.status, headers: withRequestIdHeaders(requestId) },
    );
  }

  return NextResponse.json(
    { ok: true, action: result.action, duplicate: result.duplicate ?? false, requestId },
    { headers: withRequestIdHeaders(requestId) },
  );
}
