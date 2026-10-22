import { NextResponse } from "next/server";

import { requireTrustModerator } from "@/lib/security/require-trust-moderator";
import { isUuid } from "@/lib/security/uuid";
import { VERIFICATIONS_STORAGE_BUCKET } from "@/lib/trust/verification-constants";
import { createClient } from "@/utils/supabase/server";
import { createServiceRoleClient } from "@/utils/supabase/admin";

type Params = { id: string };

const SIGNED_SEC = 60;

export async function GET(_request: Request, context: { params: Promise<Params> }) {
  const { id } = await context.params;
  if (!isUuid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const modGate = await requireTrustModerator(supabase, user.id, user.email);
  if (!modGate.ok) return modGate.response;

  const readClient =
    modGate.via === "admin_role" ? supabase : createServiceRoleClient();

  const { data: row, error } = await readClient
    .from("doctor_verifications")
    .select("diploma_file_path")
    .eq("id", id)
    .maybeSingle();

  if (error || !row?.diploma_file_path) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  }

  const admin = createServiceRoleClient();
  const { data: signed, error: signError } = await admin.storage
    .from(VERIFICATIONS_STORAGE_BUCKET)
    .createSignedUrl(row.diploma_file_path, SIGNED_SEC);

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: "Не удалось выдать ссылку" }, { status: 500 });
  }

  return NextResponse.json({ url: signed.signedUrl, expiresIn: SIGNED_SEC });
}
