import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/copilot/audit";
import { validateRegisteredImagePath } from "@/lib/copilot/storage-path";
import { rejectIfRateLimited } from "@/lib/security/api-rate-limit";
import { validateRegisteredContentType } from "@/lib/security/file-validation";
import { isUuid } from "@/lib/security/uuid";
import { ULTRASOUND_MEDIA_BUCKET } from "@/lib/copilot/types";
import { assertStudyOwnedByUser } from "@/lib/security/assert-study-owner";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const limited = await rejectIfRateLimited(request, "copilot-image-register", 60, 60_000);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  const studyId = typeof body?.studyId === "string" ? body.studyId : "";
  const seriesId = typeof body?.seriesId === "string" ? body.seriesId : "";
  const storagePath = typeof body?.storagePath === "string" ? body.storagePath : "";
  const fileName = typeof body?.fileName === "string" ? body.fileName : "";
  const contentType =
    typeof body?.contentType === "string" ? body.contentType : null;
  const byteSize =
    typeof body?.byteSize === "number" && Number.isFinite(body.byteSize)
      ? Math.trunc(body.byteSize)
      : null;
  const modalityHint =
    typeof body?.modalityHint === "string" ? body.modalityHint : null;
  const frameIndex =
    typeof body?.frameIndex === "number" && Number.isFinite(body.frameIndex)
      ? Math.trunc(body.frameIndex)
      : null;

  if (!studyId || !seriesId || !storagePath || !fileName) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!isUuid(studyId) || !isUuid(seriesId)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!validateRegisteredImagePath({
    userId: user.id,
    studyId,
    seriesId,
    storagePath,
  })) {
    return NextResponse.json({ error: "Invalid storage path" }, { status: 400 });
  }

  const typeCheck = validateRegisteredContentType(contentType, byteSize);
  if (!typeCheck.ok) {
    return NextResponse.json({ error: typeCheck.error }, { status: 400 });
  }

  const studyOwned = await assertStudyOwnedByUser(supabase, studyId, user.id);
  if (!studyOwned) {
    return NextResponse.json({ error: "Study not found" }, { status: 404 });
  }

  const { data: series, error: seriesError } = await supabase
    .from("ultrasound_series")
    .select("id,study_id")
    .eq("id", seriesId)
    .maybeSingle();

  if (seriesError || !series || series.study_id !== studyId) {
    return NextResponse.json({ error: "Series mismatch" }, { status: 400 });
  }

  const { data: image, error } = await supabase
    .from("ultrasound_images")
    .insert({
      series_id: seriesId,
      storage_bucket: ULTRASOUND_MEDIA_BUCKET,
      storage_path: storagePath,
      file_name: fileName,
      content_type: contentType,
      byte_size: byteSize,
      frame_index: frameIndex,
      modality_hint: modalityHint,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error || !image) {
    return NextResponse.json(
      { error: error?.message ?? "Image registration failed" },
      { status: 400 },
    );
  }

  await recordAuditEvent(supabase, {
    actorId: user.id,
    studyId,
    action: "image_registered",
    entityType: "ultrasound_image",
    entityId: image.id,
    payload: { storage_path: storagePath },
  });

  return NextResponse.json({ image });
}
