import { escapeLikePattern, parseTeachingCaseTags, type ListTeachingCasesQuery } from "@repo/types";
import { isProlapseTeachingCase } from "@repo/medical-calculations/popq";
import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_LIMIT = 40;
const SELECT_COLS =
  "id,title,description,anatomy,pathology,difficulty,status,is_public,created_at,user_id,orads_category,tags,channel_id";

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

  let dbQuery = supabase
    .from("cases")
    .select(SELECT_COLS)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (query.cursor) {
    dbQuery = dbQuery.lt("created_at", query.cursor);
  }

  if (query.channelId) {
    dbQuery = dbQuery.eq("channel_id", query.channelId);
  } else if (feedMode === "library") {
    dbQuery = dbQuery.is("channel_id", null);
  } else if (feedMode === "discussions") {
    dbQuery = dbQuery.not("channel_id", "is", null);
  }

  if (query.orads !== undefined) {
    dbQuery = dbQuery.eq("orads_category", query.orads);
  }

  if (tags.length > 0) {
    dbQuery = dbQuery.overlaps("tags", tags);
  }

  if (query.status) {
    dbQuery = dbQuery.eq("status", query.status);
  } else if (!userId) {
    dbQuery = dbQuery.eq("status", "published").eq("is_public", true);
  }

  if (query.q) {
    const pattern = `%${escapeLikePattern(query.q)}%`;
    dbQuery = dbQuery.or(`title.ilike.${pattern},description.ilike.${pattern}`);
  }

  const { data, error } = await dbQuery;

  if (error) {
    throw Object.assign(new Error(error.message), { status: 400, code: error.code });
  }

  let rows = (data ?? []) as TeachingCaseRow[];

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
  };
}
