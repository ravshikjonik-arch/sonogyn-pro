import { NextResponse } from "next/server";

import { UpdateProfileBodySchema } from "@repo/types";

import { consumeRateLimit } from "@/lib/security/rate-limit";
import { requireSupabaseUser } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

/**
 * Authenticated profile PATCH — updates `profiles` (RBAC/billing) and keeps `public.users` (doctor UI) in sync.
 */
export async function PATCH(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = UpdateProfileBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createClient();
  const auth = await requireSupabaseUser(supabase);
  if (!auth.ok) return auth.response;

  const rl = await consumeRateLimit(`profile-patch:${auth.userId}`, 60, 300_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const d = parsed.data;
  const profilePatch: Record<string, string> = {};
  if (d.full_name !== undefined) profilePatch.full_name = d.full_name;
  if (d.institution !== undefined) profilePatch.institution = d.institution;
  if (d.specialization !== undefined) profilePatch.specialization = d.specialization;

  if (d.avatar_storage_path !== undefined) {
    const prefix = `${auth.userId}/`;
    if (!d.avatar_storage_path.startsWith(prefix)) {
      return NextResponse.json(
        { error: "avatar_storage_path must start with your user id prefix (clinical-avatars layout)." },
        { status: 400 },
      );
    }
  }

  if (
    Object.keys(profilePatch).length === 0 &&
    d.avatar_storage_path === undefined
  ) {
    return NextResponse.json({ error: "No supported fields provided" }, { status: 400 });
  }

  const nowIso = new Date().toISOString();

  let profileRow: {
    id: string;
    role: string;
    full_name: string | null;
    institution: string | null;
    specialization: string | null;
    subscription_tier: string;
    subscription_expires_at: string | null;
    trial_ends_at: string | null;
    created_at: string;
    updated_at: string;
  };

  if (Object.keys(profilePatch).length > 0) {
    profilePatch.updated_at = nowIso;
    const { data, error } = await supabase
      .from("profiles")
      .update(profilePatch)
      .eq("id", auth.userId)
      .select(
        "id, role, full_name, institution, specialization, subscription_tier, subscription_expires_at, trial_ends_at, created_at, updated_at",
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    profileRow = data;
  } else {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, role, full_name, institution, specialization, subscription_tier, subscription_expires_at, trial_ends_at, created_at, updated_at",
      )
      .eq("id", auth.userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Profile not found" }, { status: 404 });
    }
    profileRow = data;
  }

  const { data: existingUser } = await supabase
    .from("users")
    .select("avatar_storage_path")
    .eq("id", auth.userId)
    .maybeSingle();

  const avatarPath =
    d.avatar_storage_path !== undefined
      ? d.avatar_storage_path
      : existingUser?.avatar_storage_path ?? null;

  const { error: userUpsertError } = await supabase.from("users").upsert(
    {
      id: auth.userId,
      email: auth.email ?? "",
      full_name: profileRow.full_name ?? "",
      institution: profileRow.institution,
      specialization: profileRow.specialization,
      avatar_storage_path: avatarPath,
      updated_at: nowIso,
    },
    { onConflict: "id" },
  );

  if (userUpsertError) {
    return NextResponse.json({ error: userUpsertError.message }, { status: 500 });
  }

  return NextResponse.json({ profile: profileRow });
}
