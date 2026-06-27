import { NextResponse } from "next/server";

import { escapeLikePattern } from "@repo/types";

import { getCourseMediaSignedUrl } from "@/lib/courses/storage";
import { fetchPublicAuthor } from "@/lib/courses/public-queries";
import { createSupabaseRouteHandlerClient } from "@/lib/route-handler-supabase";

/** Публичный каталог опубликованных курсов. */
export async function GET(req: Request) {
  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ error: client.message }, { status: client.status });
  }

  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.trim();
  const authorId = url.searchParams.get("authorId")?.trim();
  const priceMin = url.searchParams.get("priceMin");
  const priceMax = url.searchParams.get("priceMax");

  let query = client.supabase
    .from("courses")
    .select("id, title, description_html, price_rub, cover_storage_path, author_id, updated_at")
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  if (search) query = query.ilike("title", `%${escapeLikePattern(search)}%`);
  if (authorId) query = query.eq("author_id", authorId);
  if (priceMin != null && priceMin !== "") {
    const n = Number.parseInt(priceMin, 10);
    if (Number.isFinite(n)) query = query.gte("price_rub", n);
  }
  if (priceMax != null && priceMax !== "") {
    const n = Number.parseInt(priceMax, 10);
    if (Number.isFinite(n)) query = query.lte("price_rub", n);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const {
    data: { user },
  } = await client.supabase.auth.getUser();

  let enrolledIds = new Set<string>();
  if (user) {
    const { data: enrollments } = await client.supabase
      .from("course_enrollments")
      .select("course_id")
      .eq("user_id", user.id);
    enrolledIds = new Set((enrollments ?? []).map((e) => e.course_id as string));
  }

  const authorIds = [...new Set((data ?? []).map((c) => c.author_id as string))];
  const authorMap = new Map<string, Awaited<ReturnType<typeof fetchPublicAuthor>>>();
  await Promise.all(
    authorIds.map(async (id) => {
      authorMap.set(id, await fetchPublicAuthor(client.supabase, id));
    }),
  );

  const courses = await Promise.all(
    (data ?? []).map(async (c) => ({
      id: c.id,
      title: c.title,
      description_html: c.description_html,
      price_rub: c.price_rub,
      updated_at: c.updated_at,
      enrolled: enrolledIds.has(c.id as string),
      author: authorMap.get(c.author_id as string) ?? { userId: c.author_id, fullName: null, bio: null, avatarUrl: null, telegram: null, website: null },
      coverUrl: c.cover_storage_path
        ? await getCourseMediaSignedUrl(client.supabase, c.cover_storage_path as string, 3600)
        : null,
    })),
  );

  return NextResponse.json({ ok: true, courses });
}
