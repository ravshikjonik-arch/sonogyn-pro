import { ListTeachingCasesQuerySchema } from "@repo/types";
import { NextResponse } from "next/server";
import { z } from "zod";

import { listTeachingCases } from "@/lib/cases/teaching-cases-service";
import { isE2eCiStubMode } from "@/lib/e2e/ci-stub";
import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { getClinicalRole, roleMeetsMinimum } from "@/lib/security/require-clinical-role";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

const CreateCaseBodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).nullable().optional(),
  anatomy: z.string().trim().max(160).nullable().optional(),
  pathology: z.string().trim().max(200).nullable().optional(),
  channel_id: z.string().uuid().nullable().optional(),
  orads_category: z.number().int().min(0).max(5).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).optional(),
});

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Teaching gallery search — O-RADS, tags, text, expert review queue. */
export async function GET(request: Request) {
  const limited = await rejectIfRateLimitedPreset(request, "cases-list", RL.casesListIp);
  if (limited) return limited;

  if (isE2eCiStubMode()) {
    return NextResponse.json({
      cases: [],
      nextCursor: null,
      meta: { topic: "all", isModerator: false },
    });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);

  const userId = auth.ok ? auth.userId : null;
  if (userId) {
    const userRl = await rejectIfRateLimitedForUser(userId, "cases-list", RL.casesListUser);
    if (userRl) return userRl;
  }

  const { searchParams } = new URL(request.url);
  const parsed = ListTeachingCasesQuerySchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    orads: searchParams.get("orads") ?? undefined,
    tags: searchParams.get("tags") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    lifecycle: searchParams.get("lifecycle") ?? undefined,
    topic: searchParams.get("topic") ?? undefined,
    channelId: searchParams.get("channelId") ?? undefined,
    feedMode: searchParams.get("feedMode") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
    cursor: searchParams.get("cursor") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const role = userId ? await getClinicalRole(supabase, userId) : null;
  const isModerator = role ? roleMeetsMinimum(role, "moderator") : false;

  try {
    const { cases, nextCursor } = await listTeachingCases(supabase, userId, parsed.data, {
      isModerator,
    });

    return NextResponse.json({
      cases,
      nextCursor,
      meta: {
        topic: parsed.data.topic ?? "all",
        isModerator,
      },
    });
  } catch (err) {
    const status =
      err && typeof err === "object" && "status" in err && typeof err.status === "number"
        ? err.status
        : 500;
    if (status === 403) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (isE2eCiStubMode()) {
      return NextResponse.json({
        cases: [],
        nextCursor: null,
        meta: { topic: "all", isModerator: false },
      });
    }
    safeLog("cases list error", { message: err instanceof Error ? err.message : "unknown" });
    const message = err instanceof Error ? err.message : "List failed";
    return NextResponse.json({ error: message }, { status: status >= 400 && status < 600 ? status : 500 });
  }
}

/** Create an anonymized draft case/question for doctor discussion. */
export async function POST(request: Request) {
  const limited = await rejectIfRateLimitedPreset(request, "cases-create", RL.casesListIp);
  if (limited) return limited;

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "cases-create", RL.syncBurst);
  if (userRl) return userRl;

  const json = await request.json().catch(() => null);
  const parsed = CreateCaseBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from("cases")
      .insert({
        user_id: auth.userId,
        title: parsed.data.title,
        description: emptyToNull(parsed.data.description),
        anatomy: emptyToNull(parsed.data.anatomy),
        pathology: emptyToNull(parsed.data.pathology),
        channel_id: parsed.data.channel_id ?? null,
        orads_category: parsed.data.orads_category ?? null,
        tags: (parsed.data.tags ?? []).map((t) => t.toLowerCase()),
        status: "draft",
        is_public: false,
      })
      .select("id")
      .single();

    if (error || !data?.id) {
      safeLog("cases create error", { message: error?.message ?? "missing id" });
      return NextResponse.json({ error: error?.message ?? "Create failed" }, { status: 500 });
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
  } catch (err) {
    safeLog("cases create error", { message: err instanceof Error ? err.message : "unknown" });
    const message = err instanceof Error ? err.message : "Create failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
