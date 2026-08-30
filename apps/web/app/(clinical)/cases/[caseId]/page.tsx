import { notFound } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { isDevSkipAuthEnabled, isFullOpenAccessEnabled } from "@/lib/auth/dev-account";

import { CaseDetailClient, type CaseDetailData } from "./case-detail-client";

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

  if (!user && !isDevSkipAuthEnabled() && !isFullOpenAccessEnabled()) {
    notFound();
  }

  let selectCols =
    "id,title,description,anatomy,pathology,difficulty,status,is_public,created_at,user_id,flag_reason,channel_id,lifecycle_status,confirmed_diagnosis,knowledge_base_at,is_rare,rare_slot,editorial_priority";

  let { data: row, error } = await supabase.from("cases").select(selectCols).eq("id", caseId).maybeSingle();

  if (error?.message?.includes("confirmed_diagnosis") || error?.message?.includes("knowledge_base_at")) {
    selectCols =
      "id,title,description,anatomy,pathology,difficulty,status,is_public,created_at,user_id,flag_reason,channel_id,lifecycle_status,is_rare,rare_slot,editorial_priority";
    ({ data: row, error } = await supabase.from("cases").select(selectCols).eq("id", caseId).maybeSingle());
  } else if (error?.message?.includes("lifecycle_status")) {
    selectCols =
      "id,title,description,anatomy,pathology,difficulty,status,is_public,created_at,user_id,flag_reason,channel_id";
    ({ data: row, error } = await supabase.from("cases").select(selectCols).eq("id", caseId).maybeSingle());
  } else if (error?.message?.includes("is_rare") || error?.message?.includes("editorial_priority")) {
    selectCols =
      "id,title,description,anatomy,pathology,difficulty,status,is_public,created_at,user_id,flag_reason,channel_id,lifecycle_status";
    ({ data: row, error } = await supabase.from("cases").select(selectCols).eq("id", caseId).maybeSingle());
  }

  if (error || !row) {
    notFound();
  }

  const teachingCase = row as unknown as CaseDetailData;

  let isModerator = false;
  let isExpert = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role,medical_access_status,medical_verified_at")
      .eq("id", user.id)
      .maybeSingle();
    const role = profile?.role as string | undefined;
    isModerator = role === "moderator" || role === "admin";
    isExpert =
      isModerator ||
      (profile?.medical_access_status === "verified_doctor" && Boolean(profile?.medical_verified_at));
  }

  let channelTitle: string | null = null;
  if (teachingCase.channel_id) {
    const { data: channelRow } = await supabase
      .from("doctor_chat_channels")
      .select("title")
      .eq("id", teachingCase.channel_id)
      .maybeSingle();
    channelTitle = channelRow?.title ?? null;
  }

  return (
    <CaseDetailClient
      teachingCase={teachingCase}
      channelTitle={channelTitle}
      openedFromPush={search.from === "push"}
      devSkip={isDevSkipAuthEnabled()}
      isModerator={isModerator}
      isExpert={isExpert}
    />
  );
}
