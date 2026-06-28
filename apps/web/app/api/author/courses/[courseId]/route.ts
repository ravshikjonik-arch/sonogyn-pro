import { NextResponse } from "next/server";

import { withAuthorCourseApi } from "@/lib/courses/api-handler";
import { fetchCourseTree } from "@/lib/courses/queries";
import { getCourseMediaSignedUrl } from "@/lib/courses/storage";
import { CourseUpsertSchema } from "@/lib/courses/schemas";
import { sanitizeCourseUpsertFields } from "@/lib/courses/sanitize-upsert";

type Params = { params: Promise<{ courseId: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { courseId } = await params;
  return withAuthorCourseApi(courseId, async ({ supabase }) => {
    const tree = await fetchCourseTree(supabase, courseId);
    if (!tree) return NextResponse.json({ error: "Курс не найден." }, { status: 404 });

    let coverUrl: string | null = null;
    if (tree.cover_storage_path) {
      coverUrl = await getCourseMediaSignedUrl(supabase, tree.cover_storage_path);
    }

    return NextResponse.json({ ok: true, course: tree, coverUrl });
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const { courseId } = await params;
  return withAuthorCourseApi(courseId, async ({ supabase }) => {
    const body = (await req.json().catch(() => null)) as unknown;
    const parsed = CourseUpsertSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const safe = sanitizeCourseUpsertFields(parsed.data);

    const patch = {
      ...safe,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from("courses").update(patch).eq("id", courseId).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, course: data });
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { courseId } = await params;
  return withAuthorCourseApi(courseId, async ({ supabase }) => {
    const { error } = await supabase.from("courses").delete().eq("id", courseId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  });
}
