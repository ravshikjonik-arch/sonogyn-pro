import { NextResponse } from "next/server";

import { countUserCourseEnrollments } from "@/lib/career/enrollments";
import { processEnrollmentMilestone } from "@/lib/career/milestones";
import { resolveAppOrigin } from "@/lib/auth/app-origin";
import { enrollUserInCourse } from "@/lib/courses/enroll-user";
import { isYooKassaConfigured } from "@/lib/payment/config";
import { createPaymentViaSdk } from "@/lib/payment/yookassa-sdk-client";
import { createSupabaseRouteHandlerClient } from "@/lib/route-handler-supabase";
import { createServiceRoleClient } from "@/utils/supabase/admin";

type Params = { params: Promise<{ courseId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { courseId } = await params;
  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.message }, { status: client.status });
  }

  const {
    data: { user },
  } = await client.supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Войдите, чтобы записаться на курс." }, { status: 401 });
  }

  const { data: course, error: courseErr } = await client.supabase
    .from("courses")
    .select("id, title, status, price_rub")
    .eq("id", courseId)
    .maybeSingle();

  if (courseErr || !course || course.status !== "published") {
    return NextResponse.json({ error: "Курс недоступен." }, { status: 404 });
  }

  const beforeCount = await countUserCourseEnrollments(client.supabase, user.id);
  const priceRub = course.price_rub as number;

  if (priceRub > 0) {
    if (!isYooKassaConfigured()) {
      return NextResponse.json({ error: "Оплата курсов пока не настроена (ЮKassa)." }, { status: 503 });
    }

    const appOrigin = resolveAppOrigin(req);
    const description = `Курс «${course.title}» · SonoGyn Pro`;
    const returnUrl = `${appOrigin}/tools/refs/courses?enrolled=${courseId}`;

    const payment = await createPaymentViaSdk({
      userId: user.id,
      amountRub: priceRub,
      description,
      returnUrl,
      metadata: { userId: user.id, kind: "course", courseId },
    });

    const confirmationUrl =
      payment.confirmation && "confirmation_url" in payment.confirmation
        ? payment.confirmation.confirmation_url ?? null
        : null;

    const admin = createServiceRoleClient();
    await admin.from("payments").insert({
      user_id: user.id,
      yookassa_id: payment.id,
      amount: priceRub,
      status: payment.status,
      description,
      confirmation_url: confirmationUrl,
      metadata: { userId: user.id, kind: "course", courseId },
    });

    return NextResponse.json({
      ok: true,
      requiresPayment: true,
      confirmationUrl,
      amountRub: priceRub,
    });
  }

  const enrolled = await enrollUserInCourse(client.supabase, {
    userId: user.id,
    courseId,
    amountRub: 0,
  });

  if (!enrolled.ok) {
    return NextResponse.json({ error: enrolled.error }, { status: 400 });
  }

  const career = await processEnrollmentMilestone({
    supabase: client.supabase,
    userId: user.id,
    email: user.email ?? null,
    courseTitle: course.title as string,
    beforeEnrollmentCount: beforeCount,
    req,
  });

  return NextResponse.json({
    ok: true,
    requiresPayment: false,
    enrollmentId: enrolled.enrollmentId,
    career,
  });
}
