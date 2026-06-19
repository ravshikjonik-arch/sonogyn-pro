import type { SupabaseClient } from "@supabase/supabase-js";

import type { AuthorDashboardStats, CourseWithTree, StudentRow } from "@/lib/courses/types";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function fetchAuthorDashboard(
  supabase: SupabaseClient,
  authorId: string,
): Promise<AuthorDashboardStats> {
  const since = new Date();
  since.setDate(since.getDate() - 29);

  const [{ count: courseCount }, { data: enrollments }, { data: sales }, { data: allSales }, { data: offlineRegs }] = await Promise.all([
    supabase.from("courses").select("id", { count: "exact", head: true }).eq("author_id", authorId),
    supabase.from("course_enrollments").select("id, course_id").in(
      "course_id",
      (
        await supabase.from("courses").select("id").eq("author_id", authorId)
      ).data?.map((c) => c.id) ?? ["00000000-0000-0000-0000-000000000000"],
    ),
    supabase
      .from("course_sales")
      .select("amount_rub, sold_at")
      .eq("author_id", authorId)
      .gte("sold_at", since.toISOString()),
    supabase.from("course_sales").select("amount_rub").eq("author_id", authorId),
    supabase
      .from("offline_lesson_registrations")
      .select("id, lesson_id, course_id, user_id, registered_at, status")
      .in(
        "course_id",
        (
          await supabase.from("courses").select("id").eq("author_id", authorId)
        ).data?.map((c) => c.id) ?? ["00000000-0000-0000-0000-000000000000"],
      )
      .order("registered_at", { ascending: false })
      .limit(10),
  ]);

  const studentCount = enrollments?.length ?? 0;
  const revenueRub = (sales ?? []).reduce((sum, s) => sum + (s.amount_rub as number), 0);
  const totalRevenueRub = (allSales ?? []).reduce((sum, s) => sum + (s.amount_rub as number), 0);

  const byDay = new Map<string, { amountRub: number; count: number }>();
  for (let i = 0; i < 30; i += 1) {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    byDay.set(isoDate(d), { amountRub: 0, count: 0 });
  }
  for (const sale of sales ?? []) {
    const key = isoDate(new Date(sale.sold_at as string));
    const bucket = byDay.get(key);
    if (bucket) {
      bucket.amountRub += sale.amount_rub as number;
      bucket.count += 1;
    }
  }

  const salesLast30Days = [...byDay.entries()].map(([date, v]) => ({ date, ...v }));

  const lessonIds = [...new Set((offlineRegs ?? []).map((r) => r.lesson_id as string))];
  const { data: lessons } = lessonIds.length
    ? await supabase.from("course_lessons").select("id, title").in("id", lessonIds)
    : { data: [] };
  const lessonTitle = new Map((lessons ?? []).map((l) => [l.id as string, l.title as string]));

  const recentOfflineRegistrations = (offlineRegs ?? []).map((r) => ({
    id: r.id as string,
    lesson_id: r.lesson_id as string,
    course_id: r.course_id as string,
    user_id: r.user_id as string,
    registered_at: r.registered_at as string,
    status: r.status as "registered" | "cancelled" | "attended",
    lesson_title: lessonTitle.get(r.lesson_id as string),
  }));

  return {
    studentCount,
    revenueRub,
    totalRevenueRub,
    courseCount: courseCount ?? 0,
    salesLast30Days,
    recentOfflineRegistrations,
  };
}

export async function fetchCourseTree(
  supabase: SupabaseClient,
  courseId: string,
): Promise<CourseWithTree | null> {
  const { data: course } = await supabase.from("courses").select("*").eq("id", courseId).maybeSingle();
  if (!course) return null;

  const { data: modules } = await supabase
    .from("course_modules")
    .select("*")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });

  const { data: lessons } = await supabase
    .from("course_lessons")
    .select("*")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });

  const lessonsByModule = new Map<string, typeof lessons>();
  for (const lesson of lessons ?? []) {
    const list = lessonsByModule.get(lesson.module_id as string) ?? [];
    list.push(lesson);
    lessonsByModule.set(lesson.module_id as string, list);
  }

  return {
    ...(course as CourseWithTree),
    modules: (modules ?? []).map((m) => ({
      ...(m as CourseWithTree["modules"][number]),
      lessons: (lessonsByModule.get(m.id as string) ?? []) as CourseWithTree["modules"][number]["lessons"],
    })),
  };
}

export async function fetchCourseStudents(
  supabase: SupabaseClient,
  courseId: string,
  adminClient: SupabaseClient | null,
): Promise<StudentRow[]> {
  const { data: enrollments } = await supabase
    .from("course_enrollments")
    .select("user_id, progress_percent, enrolled_at, last_activity_at")
    .eq("course_id", courseId)
    .order("enrolled_at", { ascending: false });

  const rows: StudentRow[] = [];
  for (const e of enrollments ?? []) {
    let fullName: string | null = null;
    let email: string | null = null;
    let phone: string | null = null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", e.user_id as string)
      .maybeSingle();
    fullName = profile?.full_name ?? null;

    if (adminClient) {
      const { data: userData } = await adminClient.auth.admin.getUserById(e.user_id as string);
      email = userData.user?.email ?? null;
      const meta = userData.user?.user_metadata ?? {};
      phone = typeof meta.phone === "string" ? meta.phone : userData.user?.phone ?? null;
      if (!fullName && typeof meta.full_name === "string") fullName = meta.full_name;
    }

    rows.push({
      userId: e.user_id as string,
      fullName,
      email,
      phone,
      progressPercent: e.progress_percent as number,
      enrolledAt: e.enrolled_at as string,
      lastActivityAt: e.last_activity_at as string,
    });
  }

  return rows;
}
