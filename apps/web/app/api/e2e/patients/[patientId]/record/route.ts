import { NextResponse } from "next/server";

import testData from "@/lib/e2e/fixtures/test-data.json";
import {
  E2ePatientRecordPatchBodySchema,
  parseJsonBodyOrEmpty,
  zodErrorResponse,
} from "@/lib/security/api-body-schemas";

export const runtime = "nodejs";

function fixturesEnabled() {
  return process.env.E2E_FIXTURES === "true";
}

const SEED_PATIENT_ID = "patient-seed-1";

export async function PATCH(req: Request, ctx: { params: Promise<{ patientId: string }> }) {
  if (!fixturesEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { patientId } = await ctx.params;
  if (patientId !== SEED_PATIENT_ID || patientId.length > 64) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (req.headers.get("if-match") === "v1") {
    return NextResponse.json({ error: "Conflict" }, { status: 409 });
  }

  const parsedJson = await parseJsonBodyOrEmpty(req);
  if (!parsedJson.ok) return parsedJson.response;

  const parsed = E2ePatientRecordPatchBodySchema.safeParse(parsedJson.data ?? {});
  if (!parsed.success) return zodErrorResponse(parsed.error);

  return NextResponse.json({ ok: true, ...parsed.data });
}
