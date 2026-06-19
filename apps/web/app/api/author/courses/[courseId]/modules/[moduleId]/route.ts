import { NextResponse } from "next/server";

import { withAuthorCourseApi } from "@/lib/courses/api-handler";
import { ModuleUpsertSchema } from "@/lib/courses/schemas";

type Params = { params: Promise<{ courseId: string; moduleId: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { courseId, moduleId } = await params;
  return withAuthorCourseApi(courseId, async ({ supabase }) => {
    const body = (await req.json().catch(() => null)) as unknown;
    const parsed = ModuleUpsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("course_modules")
      .update({ title: parsed.data.title })
      .eq("id", moduleId)
      .eq("course_id", courseId)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, module: data });
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { courseId, moduleId } = await params;
  return withAuthorCourseApi(courseId, async ({ supabase }) => {
    const { error } = await supabase.from("course_modules").delete().eq("id", moduleId).eq("course_id", courseId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  });
}
