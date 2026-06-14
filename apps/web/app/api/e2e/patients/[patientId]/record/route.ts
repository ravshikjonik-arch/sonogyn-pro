import { NextResponse } from "next/server";

export const runtime = "nodejs";

function fixturesEnabled() {
  return process.env.E2E_FIXTURES === "true";
}

export async function PATCH(req: Request) {
  if (!fixturesEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (req.headers.get("if-match") === "v1") {
    return NextResponse.json({ error: "Conflict" }, { status: 409 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  return NextResponse.json({ ok: true, ...body });
}
