import { NextResponse } from "next/server";
import { z } from "zod";

import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { validateCaseMediaUpload } from "@/lib/security/file-validation";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import {
  caseMediaObjectPath,
  getCaseMediaSignedUrl,
  mediaTypeFromFile,
  TEACHING_CASE_MEDIA_BUCKET,
  type CaseMediaRow,
} from "@/lib/supabase/case-media-storage";
import { createClient } from "@/utils/supabase/server";

type Params = { params: Promise<{ caseId: string }> };

const ParamsSchema = z.object({
  caseId: z.string().uuid(),
});

async function loadCaseAccess(supabase: Awaited<ReturnType<typeof createClient>>, caseId: string, userId: string) {
  const { data: caseRow, error } = await supabase
    .from("cases")
    .select("id,user_id,status,is_public")
    .eq("id", caseId)
    .maybeSingle();

  if (error || !caseRow) return null;

  const isOwner = caseRow.user_id === userId;
  const canRead = isOwner || (caseRow.status === "published" && caseRow.is_public === true);
  return { isOwner, canRead };
}

export async function GET(request: Request, { params }: Params) {
  const limited = await rejectIfRateLimitedPreset(request, "case-media-list", RL.casesListIp);
  if (limited) return limited;

  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "case-media-list", RL.casesListUser);
  if (userRl) return userRl;

  const access = await loadCaseAccess(supabase, routeParams.data.caseId, auth.userId);
  if (!access?.canRead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("case_media")
    .select("id,case_id,storage_path,media_type,order_index,uploaded_at,anonymization_status")
    .eq("case_id", routeParams.data.caseId)
    .order("order_index", { ascending: true });

  if (error) {
    safeLog("case media list error", { code: error.code, message: error.message });
    return NextResponse.json({ error: "Не удалось загрузить медиа" }, { status: 500 });
  }

  const media = await Promise.all(
    ((data ?? []) as CaseMediaRow[]).map(async (row) => ({
      ...row,
      url: await getCaseMediaSignedUrl(supabase, row.storage_path),
    })),
  );

  return NextResponse.json({ media });
}

export async function POST(request: Request, { params }: Params) {
  const limited = await rejectIfRateLimitedPreset(request, "case-media-upload", RL.syncBurst);
  if (limited) return limited;

  const routeParams = ParamsSchema.safeParse(await params);
  if (!routeParams.success) {
    return NextResponse.json({ error: routeParams.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "case-media-upload", RL.syncBurst);
  if (userRl) return userRl;

  const access = await loadCaseAccess(supabase, routeParams.data.caseId, auth.userId);
  if (!access?.isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
  }

  const mediaType = mediaTypeFromFile(file);
  if (!mediaType) {
    return NextResponse.json({ error: "Нужен файл изображения, видео или DICOM (.dcm)" }, { status: 400 });
  }

  const validation = await validateCaseMediaUpload(file);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const storagePath = caseMediaObjectPath(auth.userId, routeParams.data.caseId, file.name);
  const { error: uploadError } = await supabase.storage
    .from(TEACHING_CASE_MEDIA_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    safeLog("case media upload error", { code: uploadError.name, message: uploadError.message });
    return NextResponse.json({ error: "Не удалось загрузить файл" }, { status: 500 });
  }

  const { data, error: insertError } = await supabase
    .from("case_media")
    .insert({
      case_id: routeParams.data.caseId,
      storage_path: storagePath,
      media_type: mediaType,
      anonymization_status: "pending",
    })
    .select("id,case_id,storage_path,media_type,order_index,uploaded_at,anonymization_status")
    .single();

  if (insertError || !data) {
    await supabase.storage.from(TEACHING_CASE_MEDIA_BUCKET).remove([storagePath]);
    safeLog("case media insert error", { code: insertError?.code, message: insertError?.message });
    return NextResponse.json({ error: "Не удалось сохранить файл в кейсе" }, { status: 500 });
  }

  return NextResponse.json(
    {
      media: {
        ...(data as CaseMediaRow),
        url: await getCaseMediaSignedUrl(supabase, storagePath),
      },
    },
    { status: 201 },
  );
}
