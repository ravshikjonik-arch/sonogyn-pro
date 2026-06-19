import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { assertCourseAccess, requireAuthorUser } from "@/lib/courses/access";
import { createSupabaseRouteHandlerClient } from "@/lib/route-handler-supabase";

type AuthorCtx = {
  supabase: SupabaseClient;
  userId: string;
  role: "author" | "admin";
};

export async function withAuthorApi(handler: (ctx: AuthorCtx) => Promise<NextResponse>): Promise<NextResponse> {
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

  const gate = await requireAuthorUser(client.supabase, user.id);
  if (!gate.ok) return gate.response;

  return handler({ supabase: client.supabase, userId: user.id, role: gate.role as "author" | "admin" });
}

export async function withAuthorCourseApi(
  courseId: string,
  handler: (ctx: AuthorCtx) => Promise<NextResponse>,
): Promise<NextResponse> {
  return withAuthorApi(async ({ supabase, userId, role }) => {
    const access = await assertCourseAccess(supabase, userId, courseId, role);
    if (!access.ok) return access.response;
    return handler({ supabase, userId, role });
  });
}
