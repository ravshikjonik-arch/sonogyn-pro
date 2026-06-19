import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveAppOrigin } from "@/lib/auth/app-origin";
import { createCourseAdminClient } from "@/lib/courses/admin-client";

import { countUserCourseEnrollments } from "./enrollments";
import {
  buildCareerProgress,
  type CareerProfileInput,
  resolveCareerStage,
} from "./resolve-stage";
import type { CareerStageId } from "./ladder";
import { sendDoctorMilestoneEmail, sendInternMilestoneEmail } from "./send-milestone-email";

export type CareerMilestone = "intern" | "doctor" | null;

export type CareerTransition = {
  previousStage: CareerStageId;
  currentStage: CareerStageId;
  milestone: CareerMilestone;
  progressPercent: number;
};

function toCareerInput(
  profile: {
    full_name: string | null;
    specialization: string | null;
    birth_year: number | null;
    subscription_tier: string;
    trial_ends_at: string | null;
  },
  courseEnrollmentCount: number,
): CareerProfileInput {
  return {
    full_name: profile.full_name,
    specialization: profile.specialization,
    birth_year: profile.birth_year,
    subscription_tier: profile.subscription_tier,
    trial_ends_at: profile.trial_ends_at,
    courseEnrollmentCount,
  };
}

export async function buildCareerTransition(
  supabase: SupabaseClient,
  userId: string,
  profile: CareerProfileInput,
): Promise<CareerTransition> {
  const progress = buildCareerProgress(profile, true);
  return {
    previousStage: progress.currentStage,
    currentStage: progress.currentStage,
    milestone: null,
    progressPercent: progress.progressPercent,
  };
}

export async function processEnrollmentMilestone(params: {
  supabase: SupabaseClient;
  userId: string;
  email: string | null;
  courseTitle: string;
  beforeEnrollmentCount: number;
  req?: Request;
}): Promise<CareerTransition> {
  const profile = await loadCareerProfileInput(params.supabase, params.userId);
  if (!profile) {
    return {
      previousStage: "student",
      currentStage: "student",
      milestone: null,
      progressPercent: 25,
    };
  }

  const beforeProfile: CareerProfileInput = { ...profile, courseEnrollmentCount: params.beforeEnrollmentCount };
  const afterProfile: CareerProfileInput = {
    ...profile,
    courseEnrollmentCount: Math.max(params.beforeEnrollmentCount + 1, 1),
  };

  return detectAndNotifyCareerMilestone({
    supabase: params.supabase,
    userId: params.userId,
    email: params.email,
    beforeProfile,
    afterProfile,
    req: params.req,
    courseTitle: params.courseTitle,
  });
}

export async function detectAndNotifyCareerMilestone(params: {
  supabase: SupabaseClient;
  userId: string;
  email: string | null;
  beforeProfile: CareerProfileInput;
  afterProfile: CareerProfileInput;
  req?: Request;
  courseTitle?: string;
}): Promise<CareerTransition> {
  const beforeStage = resolveCareerStage(params.beforeProfile, true);
  const afterStage = resolveCareerStage(params.afterProfile, true);
  const progress = buildCareerProgress(params.afterProfile, true);

  const transition: CareerTransition = {
    previousStage: beforeStage,
    currentStage: afterStage,
    milestone: null,
    progressPercent: progress.progressPercent,
  };

  if (beforeStage === afterStage || !params.email || params.email.endsWith("@telegram.sonogyn.app")) {
    return transition;
  }

  const admin = createCourseAdminClient();
  if (!admin) return transition;

  const { data: authUser } = await admin.auth.admin.getUserById(params.userId);
  const meta = authUser.user?.user_metadata ?? {};
  const appOrigin = params.req ? resolveAppOrigin(params.req) : process.env.NEXT_PUBLIC_APP_URL ?? "https://sonogyn-pro.ru";

  if (afterStage === "doctor" && beforeStage !== "doctor") {
    transition.milestone = "doctor";
    const alreadySent = Boolean(meta.career_milestone_doctor_email_sent_at);
    if (!alreadySent) {
      await sendDoctorMilestoneEmail({
        to: params.email,
        fullName: params.afterProfile.full_name,
        progress,
        appOrigin,
      });
      await admin.auth.admin.updateUserById(params.userId, {
        user_metadata: {
          ...meta,
          career_milestone_doctor_email_sent_at: new Date().toISOString(),
        },
      });
    }
  }

  if (afterStage === "intern" && beforeStage === "student") {
    transition.milestone = "intern";
    const alreadySent = Boolean(meta.career_milestone_intern_email_sent_at);
    if (!alreadySent) {
      await sendInternMilestoneEmail({
        to: params.email,
        fullName: params.afterProfile.full_name,
        courseTitle: params.courseTitle,
        appOrigin,
      });
      await admin.auth.admin.updateUserById(params.userId, {
        user_metadata: {
          ...meta,
          career_milestone_intern_email_sent_at: new Date().toISOString(),
        },
      });
    }
  }

  return transition;
}

export async function loadCareerProfileInput(
  supabase: SupabaseClient,
  userId: string,
): Promise<CareerProfileInput | null> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, specialization, birth_year, subscription_tier, trial_ends_at")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return null;

  const count = await countUserCourseEnrollments(supabase, userId);
  return toCareerInput(profile, count);
}
