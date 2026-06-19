import { NextResponse } from "next/server";

import { createCourseAdminClient } from "@/lib/courses/admin-client";
import { withAuthorCourseApi } from "@/lib/courses/api-handler";
import { studentsToCsv } from "@/lib/courses/csv";
import { fetchCourseStudents } from "@/lib/courses/queries";

type Params = { params: Promise<{ courseId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { courseId } = await params;
  return withAuthorCourseApi(courseId, async ({ supabase }) => {
    const admin = createCourseAdminClient();
    const students = await fetchCourseStudents(supabase, courseId, admin);
    const csv = studentsToCsv(students);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="course-${courseId}-students.csv"`,
      },
    });
  });
}
