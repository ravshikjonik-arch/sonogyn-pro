import { NextResponse } from "next/server";

import testData from "@/lib/e2e/fixtures/test-data.json";

export const runtime = "nodejs";

function fixturesEnabled() {
  return process.env.E2E_FIXTURES === "true";
}

export async function GET() {
  if (!fixturesEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ appointments: [testData.appointment] });
}

export async function POST(req: Request) {
  if (!fixturesEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  return NextResponse.json(
    { id: `appt-${Date.now()}`, ...testData.appointment, ...body },
    { status: 201 },
  );
}
