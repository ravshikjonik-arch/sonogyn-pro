import { NextResponse } from "next/server";

import testData from "@/lib/e2e/fixtures/test-data.json";
import {
  E2eAppointmentCreateBodySchema,
  parseJsonBodyOrEmpty,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";

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

  const parsedJson = await parseJsonBodyOrEmpty(req);
  if (!parsedJson.ok) return parsedJson.response;

  const parsed = E2eAppointmentCreateBodySchema.safeParse(parsedJson.data ?? {});
  if (!parsed.success) return zodErrorResponse(parsed.error);

  return NextResponse.json(
    { id: `appt-${Date.now()}`, ...testData.appointment, ...parsed.data },
    { status: 201 },
  );
}
