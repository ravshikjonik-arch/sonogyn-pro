import { NextResponse } from "next/server";

import { createCourseAdminClient } from "@/lib/courses/admin-client";
import { withAuthorCourseApi } from "@/lib/courses/api-handler";
import { fetchCourseStudents } from "@/lib/courses/queries";

type Params = { params: Promise<{ courseId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { courseId } = await params;
  return withAuthorCourseApi(courseId, async ({ supabase }) => {
    const admin = createCourseAdminClient();
    const students = await fetchCourseStudents(supabase, courseId, admin);
    return NextResponse.json({ ok: true, students });
  });
}
