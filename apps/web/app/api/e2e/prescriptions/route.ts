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
  return NextResponse.json([]);
}

export async function POST() {
  if (!fixturesEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ id: `rx-${Date.now()}`, ...testData.prescription }, { status: 201 });
}
