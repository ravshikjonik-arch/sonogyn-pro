import { createServiceSupabase } from "../_shared/expo-push.ts";

type Body = {
  user_id?: string;
};

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const secret = Deno.env.get("REPUTATION_WEBHOOK_SECRET")?.trim();
  const header = req.headers.get("x-reputation-secret")?.trim();
  if (!secret || !header || header !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const userId = body.user_id?.trim();
  if (!userId) {
    return new Response(JSON.stringify({ error: "user_id required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createServiceSupabase();
  const { data, error } = await supabase.rpc("recalculate_reputation", {
    p_user_id: userId,
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      ok: true,
      profile: data
        ? {
            id: data.id,
            reputation: data.reputation,
            cases_count: data.cases_count,
            is_verified: data.is_verified,
          }
        : null,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
