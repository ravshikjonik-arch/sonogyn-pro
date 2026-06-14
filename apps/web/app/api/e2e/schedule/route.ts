import { NextResponse } from "next/server";

import testData from "@/lib/e2e/fixtures/test-data.json";

export const runtime = "nodejs";

function fixturesEnabled() {
  return process.env.E2E_FIXTURES === "true";
}

export async function GET(req: Request) {
  if (!fixturesEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const day = new URL(req.url).searchParams.get("day") ?? "today";
  const slots = day === "tomorrow" ? testData.schedule.tomorrow : testData.schedule.today;
  return NextResponse.json({ day, slots });
}
