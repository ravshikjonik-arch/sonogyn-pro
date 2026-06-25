import { NextResponse } from "next/server";
import { recordAuditEvent } from "@/lib/copilot/audit";
import { validateRegisteredImagePath } from "@/lib/copilot/storage-path";
import { rejectIfRateLimitedPreset, rejectIfSyncBurstForUser } from "@/lib/security/api-rate-limit";
import {
  CopilotImageRegisterBodySchema,
  parseJsonBody,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";
import { RL } from "@/lib/security/rate-limit-config";
import {
  validateRegisteredContentType,
  validateRegisteredStorageSignature,
} from "@/lib/security/file-validation";
import { assertStudyOwnedByUser } from "@/lib/security/assert-study-owner";
import { ULTRASOUND_MEDIA_BUCKET } from "@/lib/copilot/types";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const limited = await rejectIfRateLimitedPreset(request, "copilot-image-register", RL.copilotImageRegister);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const burst = await rejectIfSyncBurstForUser(user.id);
  if (burst) return burst;

  const raw = await parseJsonBody(request);
  if (!raw.ok) return raw.response;

  const parsed = CopilotImageRegisterBodySchema.safeParse(raw.data);
  if (!parsed.success) return zodErrorResponse(parsed.error);

  const {
    studyId,
    seriesId,
    storagePath,
    fileName,
    contentType = null,
    byteSize = null,
    modalityHint = null,
    frameIndex = null,
  } = parsed.data;

  if (
    !validateRegisteredImagePath({
      userId: user.id,
      studyId,
      seriesId,
      storagePath,
    })
  ) {
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

  const { data: blob, error: downloadError } = await supabase.storage
    .from(ULTRASOUND_MEDIA_BUCKET)
    .download(storagePath);

  if (downloadError || !blob) {
    return NextResponse.json({ error: "Storage object not found" }, { status: 400 });
  }

  const actualSize = blob.size;
  if (byteSize != null && byteSize !== actualSize) {
    return NextResponse.json({ error: "Размер файла не совпадает с заявленным" }, { status: 400 });
  }

  const buffer = new Uint8Array(await blob.arrayBuffer());
  const signatureCheck = validateRegisteredStorageSignature(contentType, buffer, actualSize);
  if (!signatureCheck.ok) {
    return NextResponse.json({ error: signatureCheck.error }, { status: 400 });
  }

  const { data: image, error } = await supabase
    .from("ultrasound_images")
    .insert({
      series_id: seriesId,
      storage_bucket: ULTRASOUND_MEDIA_BUCKET,
      storage_path: storagePath,
      file_name: fileName,
      content_type: contentType,
      byte_size: actualSize,
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
    payload: { storage_path: storagePath, byte_size: actualSize },
  });

  return NextResponse.json({ image });
}
