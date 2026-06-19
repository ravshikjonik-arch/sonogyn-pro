import { NextResponse } from "next/server";

import { fetchCourseProgress } from "@/lib/courses/progress";
import { canAccessCourseContent } from "@/lib/courses/student-access";
import { createSupabaseRouteHandlerClient } from "@/lib/route-handler-supabase";

type Params = { params: Promise<{ courseId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { courseId } = await params;
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

  const allowed = await canAccessCourseContent(client.supabase, user.id, courseId);
  if (!allowed) {
    return NextResponse.json({ error: "Нет доступа к курсу." }, { status: 403 });
  }

  const progress = await fetchCourseProgress(client.supabase, user.id, courseId);

  return NextResponse.json({ ok: true, progress });
}
