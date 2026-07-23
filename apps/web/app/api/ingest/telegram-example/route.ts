import { NextResponse } from "next/server";
import { z } from "zod";

import { findUserByTelegramId } from "@/lib/auth/telegram-supabase";
import { rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { validateCaseMediaUpload } from "@/lib/security/file-validation";
import { RL } from "@/lib/security/rate-limit-config";
import { safeLog } from "@/lib/security/safeLog";
import {
  isTelegramExampleIngestAuthorized,
  isTelegramExampleUserAllowed,
} from "@/lib/security/telegram-example-ingest-auth";
import {
  caseMediaObjectPath,
  getCaseMediaSignedUrl,
  mediaTypeFromFile,
  TEACHING_CASE_MEDIA_BUCKET,
  type CaseMediaRow,
} from "@/lib/supabase/case-media-storage";
import { createServiceRoleClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

const MetaSchema = z.object({
  telegram_user_id: z.string().trim().regex(/^\d{5,20}$/),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional().nullable(),
  anatomy: z.string().trim().max(160).optional().nullable(),
  pathology: z.string().trim().max(200).optional().nullable(),
});

function emptyToNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function appOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
    "https://sonogyn-pro.ru"
  );
}

/**
 * POST /api/ingest/telegram-example
 * Multipart: file + telegram_user_id + title (+ optional description/anatomy/pathology)
 * Auth: Bearer TELEGRAM_EXAMPLE_INGEST_SECRET
 * Creates a draft teaching case owned by the Telegram-linked doctor account.
 */
export async function POST(request: Request) {
  const limited = await rejectIfRateLimitedPreset(request, "telegram-example-ingest", RL.syncBurst);
  if (limited) return limited;

  if (!isTelegramExampleIngestAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const parsed = MetaSchema.safeParse({
    telegram_user_id: form.get("telegram_user_id"),
    title: form.get("title"),
    description: form.get("description") || null,
    anatomy: form.get("anatomy") || null,
    pathology: form.get("pathology") || null,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (!isTelegramExampleUserAllowed(parsed.data.telegram_user_id)) {
    return NextResponse.json({ error: "Telegram user not allowed" }, { status: 403 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
  }

  // Telegram examples: images only (v1). Coerce empty MIME so magic-byte validation still runs.
  const uploadFile =
    file.type && file.type.length > 0
      ? file
      : new File([await file.arrayBuffer()], file.name || "telegram-example.jpg", {
          type: "image/jpeg",
        });

  const mediaType = mediaTypeFromFile(uploadFile);
  if (mediaType !== "image") {
    return NextResponse.json({ error: "Нужно изображение (JPEG/PNG/WebP/GIF)" }, { status: 400 });
  }

  const validation = await validateCaseMediaUpload(uploadFile);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  let admin: ReturnType<typeof createServiceRoleClient>;
  try {
    admin = createServiceRoleClient();
  } catch {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 503 });
  }

  const ownerOverride = process.env.TELEGRAM_EXAMPLE_OWNER_USER_ID?.trim();
  let ownerUserId = ownerOverride || null;
  if (!ownerUserId) {
    const user = await findUserByTelegramId(admin, parsed.data.telegram_user_id);
    ownerUserId = user?.id ?? null;
  }
  if (!ownerUserId) {
    return NextResponse.json(
      { error: "Нет аккаунта SonoGyn, привязанного к этому Telegram" },
      { status: 404 },
    );
  }

  const descriptionParts = [
    emptyToNull(parsed.data.description),
    "Источник: Telegram · учебный пример · черновик · без ФИО/идентификаторов пациента",
  ].filter(Boolean);

  const { data: caseRow, error: caseError } = await admin
    .from("cases")
    .insert({
      user_id: ownerUserId,
      title: parsed.data.title,
      description: descriptionParts.join("\n\n"),
      anatomy: emptyToNull(parsed.data.anatomy),
      pathology: emptyToNull(parsed.data.pathology),
      channel_id: null,
      status: "draft",
      is_public: false,
    })
    .select("id")
    .single();

  if (caseError || !caseRow?.id) {
    safeLog("telegram-example case create error", { message: caseError?.message ?? "missing id" });
    return NextResponse.json({ error: caseError?.message ?? "Create failed" }, { status: 500 });
  }

  const storagePath = caseMediaObjectPath(
    ownerUserId,
    caseRow.id,
    uploadFile.name || "telegram-example.jpg",
  );
  const { error: uploadError } = await admin.storage
    .from(TEACHING_CASE_MEDIA_BUCKET)
    .upload(storagePath, uploadFile, {
      contentType: uploadFile.type || "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    await admin.from("cases").delete().eq("id", caseRow.id);
    safeLog("telegram-example upload error", { message: uploadError.message });
    return NextResponse.json({ error: "Не удалось загрузить файл" }, { status: 500 });
  }

  const { data: mediaRow, error: mediaError } = await admin
    .from("case_media")
    .insert({
      case_id: caseRow.id,
      storage_path: storagePath,
      media_type: "image",
      anonymization_status: "pending",
    })
    .select("id,case_id,storage_path,media_type,order_index,uploaded_at,anonymization_status")
    .single();

  if (mediaError || !mediaRow) {
    await admin.storage.from(TEACHING_CASE_MEDIA_BUCKET).remove([storagePath]);
    await admin.from("cases").delete().eq("id", caseRow.id);
    safeLog("telegram-example media insert error", { message: mediaError?.message });
    return NextResponse.json({ error: "Не удалось сохранить медиа" }, { status: 500 });
  }

  const caseUrl = `${appOrigin()}/cases/${caseRow.id}`;
  const previewUrl = await getCaseMediaSignedUrl(admin, storagePath);

  return NextResponse.json(
    {
      ok: true,
      caseId: caseRow.id,
      caseUrl,
      status: "draft",
      media: {
        ...(mediaRow as CaseMediaRow),
        url: previewUrl,
      },
      note: "Черновик учебного примера. Опубликуйте на сайте после проверки анонимизации.",
    },
    { status: 201 },
  );
}
