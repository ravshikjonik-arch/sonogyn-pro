import { NextResponse } from "next/server";

import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { VERIFICATIONS_STORAGE_BUCKET } from "@/lib/trust/verification-constants";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/admin";

const SIGNED_SEC = 60;

/** Signed URL (60 с) на свой скан диплома — без прямого чтения bucket с клиента. */
export async function GET(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) return auth.response;

  const { data: row } = await supabase
    .from("doctor_verifications")
    .select("diploma_file_path")
    .eq("user_id", auth.userId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row?.diploma_file_path) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  }

  const admin = createServiceRoleClient();
  const { data: signed, error } = await admin.storage
    .from(VERIFICATIONS_STORAGE_BUCKET)
    .createSignedUrl(row.diploma_file_path, SIGNED_SEC);

  if (error || !signed?.signedUrl) {
    return NextResponse.json({ error: "Не удалось выдать ссылку" }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl, expiresIn: SIGNED_SEC });
}
