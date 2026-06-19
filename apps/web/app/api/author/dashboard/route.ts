import { NextResponse } from "next/server";

import { withAuthorApi } from "@/lib/courses/api-handler";
import { fetchAuthorDashboard } from "@/lib/courses/queries";

export async function GET() {
  return withAuthorApi(async ({ supabase, userId }) => {
    const stats = await fetchAuthorDashboard(supabase, userId);
    return NextResponse.json({ ok: true, stats });
  });
}
