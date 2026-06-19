import { NextResponse } from "next/server";

import { withAuthorCourseApi } from "@/lib/courses/api-handler";
import { ModuleReorderSchema, ModuleUpsertSchema } from "@/lib/courses/schemas";

type Params = { params: Promise<{ courseId: string }> };

export async function POST(req: Request, { params }: Params) {
  const { courseId } = await params;
  return withAuthorCourseApi(courseId, async ({ supabase }) => {
    const body = (await req.json().catch(() => null)) as unknown;
    const parsed = ModuleUpsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { data: last } = await supabase
      .from("course_modules")
      .select("sort_order")
      .eq("course_id", courseId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const sort_order = (last?.sort_order ?? -1) + 1;

    const { data, error } = await supabase
      .from("course_modules")
      .insert({ course_id: courseId, title: parsed.data.title, sort_order })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, module: data });
  });
}

export async function PUT(req: Request, { params }: Params) {
  const { courseId } = await params;
  return withAuthorCourseApi(courseId, async ({ supabase }) => {
    const body = (await req.json().catch(() => null)) as unknown;
    const parsed = ModuleReorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    await Promise.all(
      parsed.data.moduleIds.map((id, index) =>
        supabase.from("course_modules").update({ sort_order: index }).eq("id", id).eq("course_id", courseId),
      ),
    );

    return NextResponse.json({ ok: true });
  });
}
