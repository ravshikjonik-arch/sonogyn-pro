import { NextResponse } from "next/server";

import type { SupabaseClient } from "@supabase/supabase-js";

export type ClinicalRole = "user" | "moderator" | "admin";

const ROLE_RANK: Record<ClinicalRole, number> = {
  user: 1,
  moderator: 2,
  admin: 3,
};

export async function getClinicalRole(
  supabase: SupabaseClient,
  userId: string,
): Promise<ClinicalRole | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data?.role) return null;
  const role = data.role as string;
  if (role === "admin" || role === "moderator" || role === "user") return role;
  return "user";
}

/** Returns true if user role meets minimum required rank. */
export function roleMeetsMinimum(role: ClinicalRole, minimum: ClinicalRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export async function requireClinicalRole(
  supabase: SupabaseClient,
  userId: string,
  minimum: ClinicalRole,
): Promise<{ ok: true; role: ClinicalRole } | { ok: false; response: NextResponse }> {
  const role = await getClinicalRole(supabase, userId);
  if (!role || !roleMeetsMinimum(role, minimum)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, role };
}

/** Admin-only routes (operations dashboard, nosology admin). */
export async function requireAdminRole(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const gate = await requireClinicalRole(supabase, userId, "admin");
  if (!gate.ok) return gate;
  return { ok: true };
}

/** Moderator+ (community moderation, future nurse/senior workflows). */
export async function requireModeratorRole(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ ok: true; role: ClinicalRole } | { ok: false; response: NextResponse }> {
  return requireClinicalRole(supabase, userId, "moderator");
}
