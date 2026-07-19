import { NextResponse } from "next/server";
import { z } from "zod";

import { rejectIfRateLimitedForUser, rejectIfRateLimitedPreset } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { safeLog } from "@/lib/security/safeLog";
import {
  chatMediaObjectPath,
  chatMediaTypeFromFile,
  DOCTOR_CHAT_MEDIA_BUCKET,
} from "@/lib/supabase/chat-media-storage";
import { validateChatMediaUpload } from "@/lib/security/file-validation";
import { createClient } from "@/utils/supabase/server";

const BodySchema = z.object({
  scope: z.enum(["channel", "case-comment"]),
  scopeId: z.string().uuid(),
});

export async function POST(request: Request) {
  const limited = await rejectIfRateLimitedPreset(request, "doctor-chat-media-upload", RL.syncBurst);
  if (limited) return limited;

  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "doctor-chat-media-upload", RL.syncBurst);
  if (userRl) return userRl;

  const form = await request.formData().catch(() => null);
  const parsed = BodySchema.safeParse({
    scope: form?.get("scope"),
    scopeId: form?.get("scopeId"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
  }

  const mediaType = chatMediaTypeFromFile(file);
  if (!mediaType) {
    return NextResponse.json({ error: "Нужен файл изображения или видео" }, { status: 400 });
  }

  const validation = await validateChatMediaUpload(file);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const storagePath = chatMediaObjectPath(auth.userId, parsed.data.scope, parsed.data.scopeId, file.name);
  const { error } = await supabase.storage
    .from(DOCTOR_CHAT_MEDIA_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    safeLog("doctor chat media upload error", { code: error.name, message: error.message });
    return NextResponse.json({ error: "Не удалось загрузить файл" }, { status: 500 });
  }

  return NextResponse.json({
    storagePath,
    mediaType,
  }, { status: 201 });
}
