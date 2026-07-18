import type { SupabaseClient } from "@supabase/supabase-js";

import { countUserCourseEnrollments } from "@/lib/career/enrollments";
import { processEnrollmentMilestone } from "@/lib/career/milestones";
import { enrollUserInCourse } from "@/lib/courses/enroll-user";
import { TelegramService } from "@/services/telegram";

type PaymentMetadata = {
  kind?: string;
  courseId?: string;
  userId?: string;
};

/** Обновляет заказ и активирует PRO или запись на курс после payment.succeeded. */
export async function fulfillSucceededPayment(
  admin: SupabaseClient,
  params: {
    paymentRowId: string;
    userId: string;
    yookassaId: string;
    amountRub: number;
    description?: string | null;
    previousStatus: string;
    metadata?: PaymentMetadata;
    userEmail?: string | null;
  },
): Promise<void> {
  const now = new Date().toISOString();

  const { data: claimed, error: payErr } = await admin
    .from("payments")
    .update({ status: "succeeded", updated_at: now })
    .eq("id", params.paymentRowId)
    .neq("status", "succeeded")
    .select("id")
    .maybeSingle();

  if (payErr) {
    console.error("[payment/fulfill] payments update", payErr.message);
    throw payErr;
  }

  if (!claimed) {
    return;
  }

  const meta = params.metadata ?? {};
  if (meta.kind === "course" && meta.courseId) {
    const beforeCount = await countUserCourseEnrollments(admin, params.userId);
    const { data: course } = await admin.from("courses").select("title").eq("id", meta.courseId).maybeSingle();

    const result = await enrollUserInCourse(admin, {
      userId: params.userId,
      courseId: meta.courseId,
      amountRub: params.amountRub,
      paymentRef: params.yookassaId,
      paymentId: params.paymentRowId,
    });

    if (!result.ok) {
      console.error("[payment/fulfill] course enroll", result.error);
      throw new Error(result.error);
    }

    await processEnrollmentMilestone({
      supabase: admin,
      userId: params.userId,
      email: params.userEmail ?? null,
      courseTitle: (course?.title as string) ?? "Курс",
      beforeEnrollmentCount: beforeCount,
    });

    await TelegramService.notifyAdmins("payment.succeeded", {
      userId: params.userId,
      yookassaId: params.yookassaId,
      amountRub: params.amountRub,
      description: params.description ?? "course",
      courseId: meta.courseId,
    });
    return;
  }

  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  const { error: profileErr } = await admin
    .from("profiles")
    .update({
      subscription_tier: "pro",
      subscription_expires_at: expires.toISOString(),
      updated_at: now,
    })
    .eq("id", params.userId);

  if (profileErr) {
    console.error("[payment/fulfill] profiles update", profileErr.message);
    throw profileErr;
  }

  await TelegramService.notifyAdmins("payment.succeeded", {
    userId: params.userId,
    yookassaId: params.yookassaId,
    amountRub: params.amountRub,
    description: params.description ?? undefined,
  });
}
