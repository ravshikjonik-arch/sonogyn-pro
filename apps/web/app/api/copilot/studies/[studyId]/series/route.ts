import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/copilot/audit";
import { rejectIfRateLimited } from "@/lib/security/api-rate-limit";
import { isUuid } from "@/lib/security/uuid";
import { createClient } from "@/utils/supabase/server";

type Params = { studyId: string };

export async function POST(
  request: Request,
  context: { params: Promise<Params> },
) {
  const limited = await rejectIfRateLimited(request, "copilot-series-create", 40, 60_000);
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

  const { data: study, error: studyError } = await supabase
    .from("studies")
    .select("id")
    .eq("id", studyId)
    .eq("created_by", user.id)
    .maybeSingle();

  if (studyError || !study) {
    return NextResponse.json({ error: "Study not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  const label =
    typeof body?.label === "string" && body.label.trim().length > 0
      ? body.label.trim().slice(0, 200)
      : "Series";

  const planeOrRegion =
    typeof body?.planeOrRegion === "string" && body.planeOrRegion.trim().length > 0
      ? body.planeOrRegion.trim().slice(0, 120)
      : null;

  const sortOrder =
    typeof body?.sortOrder === "number" && Number.isFinite(body.sortOrder)
      ? Math.trunc(body.sortOrder)
      : 0;

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
