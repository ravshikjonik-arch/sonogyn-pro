import { NextResponse } from "next/server";

import { assertCourseAccess } from "@/lib/courses/access";
import { createCourseAdminClient } from "@/lib/courses/admin-client";
import { createSupabaseRouteHandlerClient } from "@/lib/route-handler-supabase";
import { getClinicalRole } from "@/lib/security/require-clinical-role";

type Params = { params: Promise<{ lessonId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { lessonId } = await params;
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

  const role = await getClinicalRole(client.supabase, user.id);
  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: lesson } = await client.supabase
    .from("course_lessons")
    .select("id, course_id, title, lesson_type")
    .eq("id", lessonId)
    .maybeSingle();

  if (!lesson || lesson.lesson_type !== "offline") {
    return NextResponse.json({ error: "Урок не найден." }, { status: 404 });
  }

  const access = await assertCourseAccess(client.supabase, user.id, lesson.course_id as string, role);
  if (!access.ok) return access.response;

  const { data: regs, error } = await client.supabase
    .from("offline_lesson_registrations")
    .select("id, user_id, registered_at, status")
    .eq("lesson_id", lessonId)
    .eq("status", "registered")
    .order("registered_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const admin = createCourseAdminClient();
  const attendees = [];
  for (const reg of regs ?? []) {
    let fullName: string | null = null;
    let email: string | null = null;
    if (admin) {
      const { data: userData } = await admin.auth.admin.getUserById(reg.user_id as string);
      email = userData.user?.email ?? null;
      const meta = userData.user?.user_metadata ?? {};
      fullName = typeof meta.full_name === "string" ? meta.full_name : null;
    }
    const { data: profile } = await client.supabase
      .from("profiles")
      .select("full_name")
      .eq("id", reg.user_id as string)
      .maybeSingle();
    attendees.push({
      id: reg.id,
      userId: reg.user_id,
      fullName: profile?.full_name ?? fullName,
      email,
      registeredAt: reg.registered_at,
      status: reg.status,
    });
  }

  return NextResponse.json({
    ok: true,
    lesson: { id: lesson.id, title: lesson.title },
    attendees,
  });
}
