import { NextResponse } from "next/server";

import {
  ClinicalPreferencesSchema,
  UpdateProfileBodySchema,
  birthDateErrorMessage,
  parseClinicalPreferences,
  validateBirthDateIso,
} from "@repo/types";

import {
  detectAndNotifyCareerMilestone,
  loadCareerProfileInput,
} from "@/lib/career/milestones";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUser } from "@/lib/security/require-user";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const PROFILE_SELECT =
  "id, role, full_name, institution, specialization, birth_year, clinical_preferences, subscription_tier, subscription_expires_at, trial_ends_at, created_at, updated_at";

type ProfileRow = {
  id: string;
  role: string;
  full_name: string | null;
  institution: string | null;
  specialization: string | null;
  birth_year: number | null;
  clinical_preferences: Record<string, unknown> | null;
  subscription_tier: string;
  subscription_expires_at: string | null;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
};

/** Текущий профиль врача (включая clinical_preferences). */
export async function GET() {
  const supabase = await createClient();
  const auth = await requireSupabaseUser(supabase);
  if (!auth.ok) return auth.response;

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", auth.userId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({
    profile: {
      ...data,
      clinical_preferences: parseClinicalPreferences(data.clinical_preferences),
    },
  });
}

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

  const rl = await consumeRateLimit(
    `profile-patch:${auth.userId}`,
    RL.profilePatch.limit,
    RL.profilePatch.windowMs,
  );
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const d = parsed.data;

  if (d.birth_date !== undefined) {
    const birthErr = validateBirthDateIso(d.birth_date);
    if (birthErr) {
      return NextResponse.json({ error: birthDateErrorMessage(birthErr) }, { status: 400 });
    }
  }

  const beforeProfile = await loadCareerProfileInput(supabase, auth.userId);
  const beforeEnrollmentCount = beforeProfile?.courseEnrollmentCount ?? 0;

  const profilePatch: Record<string, unknown> = {};
  if (d.full_name !== undefined) profilePatch.full_name = d.full_name;
  if (d.institution !== undefined) profilePatch.institution = d.institution;
  if (d.specialization !== undefined) profilePatch.specialization = d.specialization;
  if (d.birth_year !== undefined) profilePatch.birth_year = d.birth_year;
  if (d.birth_date !== undefined) {
    profilePatch.birth_year = Number.parseInt(d.birth_date.slice(0, 4), 10);
  }

  if (d.clinical_preferences !== undefined) {
    const { data: currentRow, error: readError } = await supabase
      .from("profiles")
      .select("clinical_preferences")
      .eq("id", auth.userId)
      .maybeSingle();

    if (readError) {
      return NextResponse.json({ error: readError.message }, { status: 500 });
    }

    const merged = {
      ...parseClinicalPreferences(currentRow?.clinical_preferences),
      ...d.clinical_preferences,
    };
    const validated = ClinicalPreferencesSchema.safeParse(merged);
    if (!validated.success) {
      return NextResponse.json({ error: validated.error.flatten() }, { status: 400 });
    }
    profilePatch.clinical_preferences = validated.data;
  }

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

  let profileRow: ProfileRow;

  if (Object.keys(profilePatch).length > 0) {
    profilePatch.updated_at = nowIso;
    const { data, error } = await supabase
      .from("profiles")
      .update(profilePatch)
      .eq("id", auth.userId)
      .select(PROFILE_SELECT)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    profileRow = data as ProfileRow;
  } else {
    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("id", auth.userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Profile not found" }, { status: 404 });
    }
    profileRow = data as ProfileRow;
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
      birth_year: profileRow.birth_year ?? null,
      avatar_storage_path: avatarPath,
      updated_at: nowIso,
    },
    { onConflict: "id" },
  );

  if (userUpsertError) {
    return NextResponse.json({ error: userUpsertError.message }, { status: 500 });
  }

  if (d.birth_date !== undefined) {
    const { error: metaError } = await supabase.auth.updateUser({
      data: {
        birth_date: d.birth_date,
        birth_year: Number.parseInt(d.birth_date.slice(0, 4), 10),
      },
    });
    if (metaError) {
      return NextResponse.json({ error: metaError.message }, { status: 500 });
    }
  }

  const afterProfile =
    (await loadCareerProfileInput(supabase, auth.userId)) ??
    ({
      full_name: profileRow.full_name,
      specialization: profileRow.specialization,
      birth_year: profileRow.birth_year,
      subscription_tier: profileRow.subscription_tier,
      trial_ends_at: profileRow.trial_ends_at,
      courseEnrollmentCount: beforeEnrollmentCount,
    } as const);

  const career = beforeProfile
    ? await detectAndNotifyCareerMilestone({
        supabase,
        userId: auth.userId,
        email: auth.email,
        beforeProfile,
        afterProfile,
        req: request,
      })
    : null;

  return NextResponse.json({
    profile: {
      ...profileRow,
      clinical_preferences: parseClinicalPreferences(profileRow.clinical_preferences),
    },
    career,
  });
}
