import type { SupabaseClient } from "@supabase/supabase-js";

export type AuthorTrustMap = Record<string, { isVerified: boolean; reputation: number }>;

export async function resolveAuthorTrust(
  supabase: SupabaseClient,
  userIds: string[],
): Promise<AuthorTrustMap> {
  const unique = [...new Set(userIds.filter(Boolean))];
  const map: AuthorTrustMap = {};
  if (!unique.length) return map;

  const { data, error } = await supabase.from("profiles").select("id,is_verified,reputation").in("id", unique);

  if (error) {
    for (const id of unique) map[id] = { isVerified: false, reputation: 0 };
    return map;
  }

  for (const row of data ?? []) {
    map[row.id as string] = {
      isVerified: Boolean(row.is_verified),
      reputation: typeof row.reputation === "number" ? row.reputation : 0,
    };
  }
  for (const id of unique) {
    if (!map[id]) map[id] = { isVerified: false, reputation: 0 };
  }
  return map;
}
