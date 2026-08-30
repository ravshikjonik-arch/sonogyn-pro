import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getProtocolStructuredDraft,
  listProtocolStructuredVersions,
  restoreProtocolStructuredVersion,
  upsertProtocolStructuredDraft,
} from "@/lib/structured-editor/protocol-structured-service";
import { rejectIfRateLimitedPreset, rejectIfSyncBurstForUser } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { assertStudyOwnedByUser } from "@/lib/security/assert-study-owner";
import { isUuid } from "@/lib/security/uuid";
import { safeLog } from "@/lib/security/safeLog";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request, context: { params: Promise<{ studyId: string }> }) {
  const limited = await rejectIfRateLimitedPreset(request, "protocol-structured-read", RL.protocolRead);
  if (limited) return limited;

  const { studyId } = await context.params;
  if (!isUuid(studyId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owned = await assertStudyOwnedByUser(supabase, studyId, user.id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = new URL(request.url);
  if (url.searchParams.get("list") === "versions") {
    const versions = await listProtocolStructuredVersions(supabase, studyId);
    return NextResponse.json({ versions });
  }

  try {
    const { draft, updatedAt } = await getProtocolStructuredDraft(supabase, studyId);
    return NextResponse.json({ draft, updatedAt });
  } catch (err) {
    safeLog("protocol structured get error", { message: err instanceof Error ? err.message : "unknown" });
    return NextResponse.json({ error: "Не удалось загрузить черновик" }, { status: 500 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ studyId: string }> }) {
  const limited = await rejectIfRateLimitedPreset(request, "protocol-structured-write", RL.protocolWrite);
  if (limited) return limited;

  const { studyId } = await context.params;
  if (!isUuid(studyId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const burst = await rejectIfSyncBurstForUser(user.id);
  if (burst) return burst;

  const owned = await assertStudyOwnedByUser(supabase, studyId, user.id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json().catch(() => null);

  try {
    const result = await upsertProtocolStructuredDraft(supabase, {
      studyId,
      userId: user.id,
      body,
    });

    if (!result.ok && result.conflict) {
      return NextResponse.json({ error: "conflict", code: "CONFLICT" }, { status: 409 });
    }
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      draft: result.draft,
      updatedAt: result.updatedAt,
      versionNumber: result.versionNumber,
    });
  } catch (err) {
    safeLog("protocol structured put error", { message: err instanceof Error ? err.message : "unknown" });
    return NextResponse.json({ error: "Не удалось сохранить" }, { status: 500 });
  }
}

const RestoreSchema = z.object({ versionId: z.string().uuid() });

export async function POST(request: Request, context: { params: Promise<{ studyId: string }> }) {
  const limited = await rejectIfRateLimitedPreset(request, "protocol-structured-restore", RL.protocolWrite);
  if (limited) return limited;

  const { studyId } = await context.params;
  if (!isUuid(studyId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owned = await assertStudyOwnedByUser(supabase, studyId, user.id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const json = await request.json().catch(() => null);
  const parsed = RestoreSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const restored = await restoreProtocolStructuredVersion(supabase, {
    studyId,
    userId: user.id,
    versionId: parsed.data.versionId,
  });

  if (!restored) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  return NextResponse.json(restored);
}
