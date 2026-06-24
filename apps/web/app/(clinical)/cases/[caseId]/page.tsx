import { notFound } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";

import { CaseDetailClient } from "./case-detail-client";

type Params = { caseId: string };
type Search = { from?: string; channelId?: string };

export default async function CaseDetailPage(props: {
  params: Promise<Params>;
  searchParams: Promise<Search>;
}) {
  const { caseId } = await props.params;
  const search = await props.searchParams;
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
      "id,title,description,anatomy,pathology,difficulty,status,is_public,created_at,user_id,flag_reason,channel_id",
    )
    .eq("id", caseId)
    .maybeSingle();

  if (error || !row) {
    notFound();
  }

  let channelTitle: string | null = null;
  if (row.channel_id) {
    const { data: channelRow } = await supabase
      .from("doctor_chat_channels")
      .select("title")
      .eq("id", row.channel_id)
      .maybeSingle();
    channelTitle = channelRow?.title ?? null;
  }

  return (
    <CaseDetailClient
      teachingCase={row}
      channelTitle={channelTitle}
      openedFromPush={search.from === "push"}
      devSkip={isDevSkipAuthEnabled()}
    />
  );
}
