import type { SupabaseClient } from "@supabase/supabase-js";

export async function resolveAuthorNames(
  supabase: SupabaseClient,
  authorIds: string[],
): Promise<Record<string, string>> {
  if (!authorIds.length) return {};

  const unique = [...new Set(authorIds)];
  const { data: profiles } = await supabase.from("profiles").select("id,full_name").in("id", unique);

  const map: Record<string, string> = {};
  for (const id of unique) {
    const prof = profiles?.find((p: { id: string; full_name: string | null }) => p.id === id);
    map[id] = prof?.full_name || `Врач ${id.slice(0, 6)}`;
  }
  return map;
}
