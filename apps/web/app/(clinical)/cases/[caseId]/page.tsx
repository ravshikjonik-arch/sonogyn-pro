import { notFound } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";

import { CaseDetailClient } from "./case-detail-client";

type Params = { caseId: string };

export default async function CaseDetailPage(props: { params: Promise<Params> }) {
  const { caseId } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isDevSkipAuthEnabled()) {
    notFound();
  }

  const { data: row, error } = await supabase
    .from("cases")
    .select(
      "id,title,description,anatomy,pathology,difficulty,status,is_public,created_at,user_id,flag_reason",
    )
    .eq("id", caseId)
    .maybeSingle();

  if (error || !row) {
    notFound();
  }

  return <CaseDetailClient teachingCase={row} devSkip={isDevSkipAuthEnabled()} />;
}
