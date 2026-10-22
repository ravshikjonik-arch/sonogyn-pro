import { NextResponse } from "next/server";

import { rejectIfRateLimitedForUser } from "@/lib/security/api-rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { validateVerificationDiplomaUpload } from "@/lib/security/file-validation";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { DoctorVerificationSubmitFieldsSchema } from "@/lib/trust/verification-schemas";
import {
  VERIFICATIONS_STORAGE_BUCKET,
  verificationDiplomaObjectPath,
} from "@/lib/trust/verification-constants";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const userRl = await rejectIfRateLimitedForUser(auth.userId, "verify-submit", RL.syncBurst);
  if (userRl) return userRl;

  const form = await request.formData().catch(() => null);
  const parsed = DoctorVerificationSubmitFieldsSchema.safeParse({
    full_name: form?.get("full_name"),
    birth_date: form?.get("birth_date") ?? "",
    specialization: form?.get("specialization"),
    diploma_number: form?.get("diploma_number") ?? "",
    org_name: form?.get("org_name") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().formErrors.join("; ") || "Неверные данные" }, { status: 400 });
  }

  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Прикрепите файл диплома" }, { status: 400 });
  }

  const fileCheck = await validateVerificationDiplomaUpload(file);
  if (!fileCheck.ok) {
    return NextResponse.json({ error: fileCheck.error }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_verified")
    .eq("id", auth.userId)
    .maybeSingle();

  if (profile?.is_verified) {
    return NextResponse.json({ error: "Статус уже подтверждён" }, { status: 409 });
  }

  const { data: blocking } = await supabase
    .from("doctor_verifications")
    .select("id,status")
    .eq("user_id", auth.userId)
    .in("status", ["pending", "approved"])
    .maybeSingle();

  if (blocking) {
    return NextResponse.json({ error: "У вас уже есть активная заявка" }, { status: 409 });
  }

  const storagePath = verificationDiplomaObjectPath(auth.userId, file.name);
  const { error: uploadError } = await supabase.storage
    .from(VERIFICATIONS_STORAGE_BUCKET)
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: "Не удалось загрузить файл. Проверьте миграцию Storage." }, { status: 500 });
  }

  const birthDate = parsed.data.birth_date?.trim() ? parsed.data.birth_date.trim() : null;

  const { data: row, error: insertError } = await supabase
    .from("doctor_verifications")
    .insert({
      user_id: auth.userId,
      status: "pending",
      full_name: parsed.data.full_name,
      birth_date: birthDate,
      specialization: parsed.data.specialization,
      diploma_number: parsed.data.diploma_number?.trim() || null,
      diploma_file_path: storagePath,
      org_name: parsed.data.org_name?.trim() || null,
    })
    .select(
      "id,user_id,status,full_name,birth_date,specialization,diploma_number,diploma_file_path,org_name,submitted_at,reviewed_at,rejection_reason",
    )
    .single();

  if (insertError) {
    await supabase.storage.from(VERIFICATIONS_STORAGE_BUCKET).remove([storagePath]);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ verification: row }, { status: 201 });
}
