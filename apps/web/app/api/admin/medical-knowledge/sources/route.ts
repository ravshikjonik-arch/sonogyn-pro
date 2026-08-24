import { NextResponse } from "next/server";

import { requireClinicalRole } from "@/lib/security/require-clinical-role";
import { createClient } from "@/utils/supabase/server";

/** Editor/admin listing — metadata only, no vault files. */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const gate = await requireClinicalRole(supabase, user.id, "author");
  if (!gate.ok) return gate.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = supabase
    .from("sources")
    .select(
      "id,title,short_title,authors,organization,source_type,year,review_status,rag_allowed,version,updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(100);

  if (status) query = query.eq("review_status", status);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ sources: data ?? [] });
}
