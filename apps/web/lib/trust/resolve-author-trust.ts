import type { SupabaseClient } from "@supabase/supabase-js";

export type AuthorTrustMap = Record<string, { isVerified: boolean; reputation: number }>;

type BadgeRow = {
  id: string;
  is_verified?: boolean | null;
  reputation?: number | null;
};

/**
 * Resolve public trust badges for case authors.
 * Uses get_author_public_badges (SECURITY DEFINER) so peers cannot SELECT full profiles rows.
 */
export async function resolveAuthorTrust(
  supabase: SupabaseClient,
  userIds: string[],
): Promise<AuthorTrustMap> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const map: AuthorTrustMap = {};
  if (!unique.length) return map;

  const { data, error } = await supabase.rpc("get_author_public_badges", {
    p_user_ids: unique,
  });

  if (!error && Array.isArray(data)) {
    for (const row of data as BadgeRow[]) {
      map[row.id] = {
        isVerified: Boolean(row.is_verified),
        reputation: typeof row.reputation === "number" ? row.reputation : 0,
      };
    }
  }

  for (const id of unique) {
    if (!map[id]) map[id] = { isVerified: false, reputation: 0 };
  }
  return map;
}
