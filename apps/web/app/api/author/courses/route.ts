import { NextResponse } from "next/server";

import { withAuthorApi } from "@/lib/courses/api-handler";
import { CourseUpsertSchema } from "@/lib/courses/schemas";
import { sanitizeCourseUpsertFields } from "@/lib/courses/sanitize-upsert";

export async function GET() {
  return withAuthorApi(async ({ supabase, userId, role }) => {
    let query = supabase
      .from("courses")
      .select("id, title, status, price_rub, cover_storage_path, updated_at, created_at")
      .order("updated_at", { ascending: false });

    if (role !== "admin") {
      query = query.eq("author_id", userId);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, courses: data ?? [] });
  });
}

export async function POST(req: Request) {
  return withAuthorApi(async ({ supabase, userId }) => {
    const body = (await req.json().catch(() => null)) as unknown;
    const parsed = CourseUpsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const safe = sanitizeCourseUpsertFields(parsed.data);

    const { data, error } = await supabase
      .from("courses")
      .insert({
        author_id: userId,
        title: safe.title,
        description_html: safe.description_html ?? "",
        status: safe.status ?? "draft",
        price_rub: safe.price_rub ?? 0,
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, course: data });
  });
}
