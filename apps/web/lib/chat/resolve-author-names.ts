import type { SupabaseClient } from "@supabase/supabase-js";

import { formatDoctorChatDisplayName } from "@/lib/chat/doctor-chat-identity";

type RosterRow = {
  id: string;
  full_name: string | null;
  email?: string | null;
  specialization?: string | null;
};

export async function resolveAuthorNames(
  supabase: SupabaseClient,
  authorIds: string[],
): Promise<Record<string, string>> {
  if (!authorIds.length) return {};

  const unique = [...new Set(authorIds)];
  const map: Record<string, string> = {};
  const meta = new Map<string, { full_name: string | null; email: string | null; specialization: string | null }>();

  const { data: rpcRows, error: rpcErr } = await supabase.rpc("get_doctor_display_names", {
    p_user_ids: unique,
  });

  if (!rpcErr && rpcRows?.length) {
    for (const row of rpcRows as RosterRow[]) {
      meta.set(row.id, {
        full_name: row.full_name,
        email: row.email ?? null,
        specialization: row.specialization ?? null,
      });
    }
  }

  const missing = unique.filter((id) => !meta.has(id));
  if (missing.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id,full_name,specialization")
      .in("id", missing);
    for (const row of profiles ?? []) {
      meta.set(row.id, {
        full_name: row.full_name,
        email: null,
        specialization: row.specialization ?? null,
      });
    }
  }

  const stillMissing = unique.filter((id) => !meta.has(id) || (!meta.get(id)?.full_name && !meta.get(id)?.email));
  if (stillMissing.length) {
    const { data: users } = await supabase.from("users").select("id,full_name,email,specialization").in("id", stillMissing);
    for (const row of users ?? []) {
      const prev = meta.get(row.id);
      meta.set(row.id, {
        full_name: prev?.full_name || row.full_name,
        email: row.email ?? prev?.email ?? null,
        specialization: prev?.specialization || row.specialization || null,
      });
    }
  }

  for (const id of unique) {
    const row = meta.get(id);
    map[id] = formatDoctorChatDisplayName({
      userId: id,
      fullName: row?.full_name,
      email: row?.email,
      specialization: row?.specialization,
    });
  }

  return map;
}
