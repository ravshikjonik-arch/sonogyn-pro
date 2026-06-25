import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/copilot/audit";
import { rejectIfRateLimitedPreset, rejectIfSyncBurstForUser } from "@/lib/security/api-rate-limit";
import {
  CopilotSeriesCreateBodySchema,
  parseJsonBody,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";
import { RL } from "@/lib/security/rate-limit-config";
import { isUuid } from "@/lib/security/uuid";
import { createClient } from "@/utils/supabase/server";

type Params = { studyId: string };

export async function POST(
  request: Request,
  context: { params: Promise<Params> },
) {
  const limited = await rejectIfRateLimitedPreset(request, "copilot-series-create", RL.copilotSeriesCreate);
  if (limited) return limited;

  const { studyId } = await context.params;
  if (!isUuid(studyId)) {
    return NextResponse.json({ error: "Study not found" }, { status: 404 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const burst = await rejectIfSyncBurstForUser(user.id);
  if (burst) return burst;

  const { data: study, error: studyError } = await supabase
    .from("studies")
    .select("id")
    .eq("id", studyId)
    .eq("created_by", user.id)
    .maybeSingle();

  if (studyError || !study) {
    return NextResponse.json({ error: "Study not found" }, { status: 404 });
  }

  const raw = await parseJsonBody(request);
  if (!raw.ok) return raw.response;

  const parsed = CopilotSeriesCreateBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const body = parsed.data;

  const label = body.label && body.label.length > 0 ? body.label : "Series";

  const planeOrRegion =
    body.planeOrRegion && body.planeOrRegion.length > 0 ? body.planeOrRegion : null;

  const sortOrder = body.sortOrder ?? 0;

  const { data: series, error } = await supabase
    .from("ultrasound_series")
    .insert({
      study_id: studyId,
      label,
      plane_or_region: planeOrRegion,
      sort_order: sortOrder,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error || !series) {
    return NextResponse.json(
      { error: error?.message ?? "Series insert failed" },
      { status: 400 },
    );
  }

  await recordAuditEvent(supabase, {
    actorId: user.id,
    studyId,
    action: "series_created",
    entityType: "ultrasound_series",
    entityId: series.id,
    payload: { label },
  });

  return NextResponse.json({ series });
}
