import { NextResponse } from "next/server";

import { withAuthorApi } from "@/lib/courses/api-handler";
import { CourseUpsertSchema } from "@/lib/courses/schemas";

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

    const { data, error } = await supabase
      .from("courses")
      .insert({
        author_id: userId,
        title: parsed.data.title,
        description_html: parsed.data.description_html ?? "",
        status: parsed.data.status ?? "draft",
        price_rub: parsed.data.price_rub ?? 0,
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, course: data });
  });
}
