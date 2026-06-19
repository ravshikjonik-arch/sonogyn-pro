import { NextResponse } from "next/server";

import { getCourseMediaSignedUrl } from "@/lib/courses/storage";
import { createSupabaseRouteHandlerClient } from "@/lib/route-handler-supabase";

/** Мои записи на курсы. */
export async function GET() {
  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.message }, { status: client.status });
  }

  const {
    data: { user },
  } = await client.supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: enrollments, error } = await client.supabase
    .from("course_enrollments")
    .select("id, course_id, progress_percent, enrolled_at, last_activity_at")
    .eq("user_id", user.id)
    .order("last_activity_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const courseIds = (enrollments ?? []).map((e) => e.course_id as string);
  const { data: courses } = courseIds.length
    ? await client.supabase
        .from("courses")
        .select("id, title, description_html, cover_storage_path, price_rub, status")
        .in("id", courseIds)
    : { data: [] };

  const courseMap = new Map((courses ?? []).map((c) => [c.id as string, c]));

  const rows = await Promise.all(
    (enrollments ?? []).map(async (e) => {
      const course = courseMap.get(e.course_id as string);
      const coverUrl = course?.cover_storage_path
        ? await getCourseMediaSignedUrl(client.supabase, course.cover_storage_path as string, 3600)
        : null;
      return {
        enrollmentId: e.id,
        courseId: e.course_id,
        progressPercent: e.progress_percent,
        enrolledAt: e.enrolled_at,
        lastActivityAt: e.last_activity_at,
        course: course
          ? {
              id: course.id,
              title: course.title,
              description_html: course.description_html,
              price_rub: course.price_rub,
              status: course.status,
              coverUrl,
            }
          : null,
      };
    }),
  );

  return NextResponse.json({ ok: true, enrollments: rows });
}
