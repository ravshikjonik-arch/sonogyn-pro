import type { SupabaseClient } from "@supabase/supabase-js";

const FEED_SELECT =
  "id,title,description,anatomy,pathology,difficulty,status,is_public,created_at,user_id,orads_category,tags,channel_id,lifecycle_status,confirmed_at,is_rare,rare_slot,pathology_tags,editorial_priority";

export type FeedCaseRow = {
  id: string;
  title: string;
  description: string | null;
  anatomy: string | null;
  pathology: string | null;
  difficulty: string | null;
  status: string;
  is_public: boolean;
  created_at: string;
  user_id: string;
  orads_category: number | null;
  tags: string[] | null;
  channel_id: string | null;
  lifecycle_status: string | null;
  confirmed_at: string | null;
  is_rare: boolean;
  rare_slot: string | null;
  pathology_tags: string[] | null;
  editorial_priority: number | null;
};

export type FeedCuratedPayload = {
  caseOfDay: FeedCaseRow | null;
  confirmed: FeedCaseRow[];
  rare: FeedCaseRow[];
  /** false when lifecycle columns not migrated yet */
  lifecycleReady: boolean;
};

function normalizeRow(row: FeedCaseRow): FeedCaseRow {
  return {
    ...row,
    tags: Array.isArray(row.tags) ? row.tags : [],
    pathology_tags: Array.isArray(row.pathology_tags) ? row.pathology_tags : [],
    is_rare: Boolean(row.is_rare),
  };
}

function isPublishedPublic(row: FeedCaseRow): boolean {
  return row.status === "published" && row.is_public;
}

/** Editorial `/feed` blocks — no media thumbs (R6). */
export async function loadFeedCuratedCases(
  supabase: SupabaseClient,
): Promise<FeedCuratedPayload> {
  const empty: FeedCuratedPayload = {
    caseOfDay: null,
    confirmed: [],
    rare: [],
    lifecycleReady: false,
  };

  const { data: caseOfDayRows, error: codError } = await supabase
    .from("cases")
    .select(FEED_SELECT)
    .eq("status", "published")
    .eq("is_public", true)
    .eq("lifecycle_status", "confirmed")
    .order("editorial_priority", { ascending: false })
    .order("confirmed_at", { ascending: false, nullsFirst: false })
    .limit(1);

  if (codError?.message?.includes("lifecycle_status")) {
    return empty;
  }
  if (codError) {
    return { ...empty, lifecycleReady: true };
  }

  const caseOfDay = (caseOfDayRows?.[0] as FeedCaseRow | undefined)
    ? normalizeRow(caseOfDayRows[0] as FeedCaseRow)
    : null;

  const excludeId = caseOfDay?.id;

  let confirmedQuery = supabase
    .from("cases")
    .select(FEED_SELECT)
    .eq("status", "published")
    .eq("is_public", true)
    .eq("lifecycle_status", "confirmed")
    .order("confirmed_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(6);

  if (excludeId) confirmedQuery = confirmedQuery.neq("id", excludeId);

  const { data: confirmedRows, error: confirmedError } = await confirmedQuery;
  if (confirmedError) {
    return { caseOfDay, confirmed: [], rare: [], lifecycleReady: true };
  }

  const confirmed = ((confirmedRows ?? []) as FeedCaseRow[])
    .map(normalizeRow)
    .filter(isPublishedPublic)
    .slice(0, 5);

  let rareQuery = supabase
    .from("cases")
    .select(FEED_SELECT)
    .eq("status", "published")
    .eq("is_public", true)
    .eq("is_rare", true)
    .order("editorial_priority", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(4);

  if (excludeId) rareQuery = rareQuery.neq("id", excludeId);

  const { data: rareRows, error: rareError } = await rareQuery;
  const rare =
    rareError?.message?.includes("is_rare")
      ? []
      : ((rareRows ?? []) as FeedCaseRow[]).map(normalizeRow).filter(isPublishedPublic);

  return {
    caseOfDay,
    confirmed,
    rare,
    lifecycleReady: true,
  };
}

export function formatRareSlot(slot: string | null | undefined): string | null {
  switch (slot) {
    case "week":
      return "Редкий · неделя";
    case "month":
      return "Редкий · месяц";
    case "dont_miss":
      return "Не пропустить";
    default:
      return null;
  }
}
