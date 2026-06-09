import { NextResponse } from "next/server";

import { createSupabaseRouteHandlerClient } from "@/lib/route-handler-supabase";

/** Server-validated user for HttpOnly cookie sessions (client JS не читает refresh). */
export async function GET() {
  const client = await createSupabaseRouteHandlerClient();
  if (!client.ok) {
    return NextResponse.json({ user: null }, { status: client.status });
  }

  const {
    data: { user },
    error,
  } = await client.supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      user_metadata: user.user_metadata,
      app_metadata: user.app_metadata,
    },
  });
}
