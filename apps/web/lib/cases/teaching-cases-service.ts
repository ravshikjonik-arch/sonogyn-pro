import { escapeLikePattern, parseTeachingCaseTags, type ListTeachingCasesQuery } from "@repo/types";
import { isProlapseTeachingCase } from "@repo/medical-calculations/popq";
import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_LIMIT = 40;
const SELECT_BASE =
  "id,title,description,anatomy,pathology,difficulty,status,is_public,created_at,user_id,orads_category,tags,channel_id";
const SELECT_VOTES = "vote_up_count,vote_down_count,rating";
const SELECT_LIFECYCLE = "lifecycle_status,confirmed_diagnosis,knowledge_base_at";
const SELECT_COLS_WITH_LIFECYCLE = `${SELECT_BASE},${SELECT_LIFECYCLE},${SELECT_VOTES}`;
const SELECT_COLS_LEGACY = `${SELECT_BASE},${SELECT_VOTES}`;
const SELECT_COLS_LEGACY_NO_VOTES = SELECT_BASE;

export type TeachingCaseRow = {
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
  confirmed_diagnosis?: string | null;
  knowledge_base_at?: string | null;
  vote_up_count?: number;
  vote_down_count?: number;
  rating?: number;
};

export async function listTeachingCases(
  supabase: SupabaseClient,
  userId: string | null,
  query: ListTeachingCasesQuery,
  opts?: { isModerator?: boolean },
): Promise<{ cases: TeachingCaseRow[]; nextCursor: string | null }> {
  const isModerator = opts?.isModerator ?? false;
  const limit = query.limit ?? DEFAULT_LIMIT;
  const tags = parseTeachingCaseTags(query.tags);
  const topic = query.topic ?? "all";
  const feedMode = query.feedMode ?? "all";

  if (query.status === "review" && !isModerator) {
    throw Object.assign(new Error("Forbidden"), { status: 403 });
  }

  let result = await runCasesListQuery(supabase, SELECT_COLS_WITH_LIFECYCLE, {
    userId,
    query,
    limit,
    tags,
    feedMode,
  });

  if (
    result.error?.message?.includes("lifecycle_status") ||
    result.error?.message?.includes("knowledge_base_at") ||
    result.error?.message?.includes("confirmed_diagnosis")
  ) {
    result = await runCasesListQuery(supabase, SELECT_COLS_LEGACY, {
      userId,
      query,
      limit,
      tags,
      feedMode,
    });
  }

  if (
    result.error?.message?.includes("vote_up_count") ||
    result.error?.message?.includes("rating")
  ) {
    result = await runCasesListQuery(supabase, SELECT_COLS_LEGACY_NO_VOTES, {
      userId,
      query,
      limit,
      tags,
      feedMode,
    });
  }

  if (result.error) {
    throw Object.assign(new Error(result.error.message), { status: 400, code: result.error.code });
  }

  let rows = (result.data ?? []) as unknown as TeachingCaseRow[];

  if (topic === "prolapse") {
    rows = rows.filter(isProlapseTeachingCase);
  }

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? (page[page.length - 1]?.created_at ?? null) : null;

  return {
    cases: page.map(normalizeTeachingCaseRow),
    nextCursor,
  };
}

function normalizeTeachingCaseRow(row: TeachingCaseRow): TeachingCaseRow {
  return {
    ...row,
    tags: Array.isArray(row.tags) ? row.tags : [],
    lifecycle_status: row.lifecycle_status ?? null,
    vote_up_count: row.vote_up_count ?? 0,
    vote_down_count: row.vote_down_count ?? 0,
    rating: row.rating ?? 0,
  };
}

async function runCasesListQuery(
  supabase: SupabaseClient,
  selectCols: string,
  ctx: {
    userId: string | null;
    query: ListTeachingCasesQuery;
    limit: number;
    tags: string[];
    feedMode: ListTeachingCasesQuery["feedMode"];
  },
) {
  const { userId, query, limit, tags, feedMode } = ctx;
  const sort = query.sort ?? "date";

  let dbQuery = supabase.from("cases").select(selectCols).limit(limit + 1);

  if (sort === "rating") {
    dbQuery = dbQuery.order("rating", { ascending: false }).order("created_at", { ascending: false });
  } else {
    dbQuery = dbQuery.order("created_at", { ascending: false });
    if (query.cursor) dbQuery = dbQuery.lt("created_at", query.cursor);
  }
  if (query.channelId) dbQuery = dbQuery.eq("channel_id", query.channelId);
  else if (feedMode === "library") dbQuery = dbQuery.is("channel_id", null);
  else if (feedMode === "discussions") dbQuery = dbQuery.not("channel_id", "is", null);
  if (query.orads !== undefined) dbQuery = dbQuery.eq("orads_category", query.orads);
  if (query.lifecycle) dbQuery = dbQuery.eq("lifecycle_status", query.lifecycle);
  if (query.knowledgeBase) dbQuery = dbQuery.not("knowledge_base_at", "is", null);
  if (tags.length > 0) dbQuery = dbQuery.overlaps("tags", tags);
  if (query.status) dbQuery = dbQuery.eq("status", query.status);
  else if (!userId) dbQuery = dbQuery.eq("status", "published").eq("is_public", true);
  if (query.q) {
    const pattern = `%${escapeLikePattern(query.q)}%`;
    dbQuery = dbQuery.or(`title.ilike.${pattern},description.ilike.${pattern}`);
  }

  return await dbQuery;
}
