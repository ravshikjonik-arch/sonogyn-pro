import type { SupabaseClient } from "@supabase/supabase-js";

export async function enrollUserInCourse(
  supabase: SupabaseClient,
  params: {
    userId: string;
    courseId: string;
    paymentRef?: string | null;
    paymentId?: string | null;
    amountRub?: number;
  },
): Promise<{ ok: true; enrollmentId: string } | { ok: false; error: string }> {
  const { data: course, error: courseErr } = await supabase
    .from("courses")
    .select("id, author_id, title, status, price_rub")
    .eq("id", params.courseId)
    .maybeSingle();

  if (courseErr || !course) {
    return { ok: false, error: "Курс не найден." };
  }

  if (course.status !== "published") {
    return { ok: false, error: "Курс ещё не опубликован." };
  }

  const { data: existing } = await supabase
    .from("course_enrollments")
    .select("id")
    .eq("course_id", params.courseId)
    .eq("user_id", params.userId)
    .maybeSingle();

  if (existing?.id) {
    return { ok: true, enrollmentId: existing.id as string };
  }

  const { data: enrollment, error: enrollErr } = await supabase
    .from("course_enrollments")
    .insert({
      course_id: params.courseId,
      user_id: params.userId,
      progress_percent: 0,
      payment_id: params.paymentId ?? null,
    })
    .select("id")
    .single();

  if (enrollErr || !enrollment) {
    return { ok: false, error: enrollErr?.message ?? "Не удалось записаться." };
  }

  const amountRub = params.amountRub ?? (course.price_rub as number);
  if (amountRub > 0 || params.paymentRef) {
    await supabase.from("course_sales").insert({
      course_id: params.courseId,
      author_id: course.author_id as string,
      buyer_id: params.userId,
      amount_rub: amountRub,
      payment_ref: params.paymentRef ?? null,
    });
  }

  const { notifyCourseEnrollmentSafe } = await import("@/lib/courses/lms-notify");
  notifyCourseEnrollmentSafe({
    userId: params.userId,
    courseId: params.courseId,
    courseTitle: course.title as string,
    authorId: course.author_id as string,
    amountRub,
  });

  return { ok: true, enrollmentId: enrollment.id as string };
}
