import type { SupabaseClient } from "@supabase/supabase-js";

type RosterRow = { id: string; full_name: string | null };

export async function resolveAuthorNames(
  supabase: SupabaseClient,
  authorIds: string[],
): Promise<Record<string, string>> {
  if (!authorIds.length) return {};

  const unique = [...new Set(authorIds)];
  const map: Record<string, string> = {};

  const { data: rpcRows, error: rpcErr } = await supabase.rpc("get_doctor_display_names", {
    p_user_ids: unique,
  });

  if (!rpcErr && rpcRows?.length) {
    for (const row of rpcRows as RosterRow[]) {
      map[row.id] = row.full_name || `Врач ${row.id.slice(0, 6)}`;
    }
  } else {
    const { data: profiles } = await supabase.from("profiles").select("id,full_name").in("id", unique);
    for (const row of profiles ?? []) {
      map[row.id] = row.full_name || `Врач ${row.id.slice(0, 6)}`;
    }
  }

  for (const id of unique) {
    if (!map[id]) map[id] = `Врач ${id.slice(0, 6)}`;
  }

  return map;
}
