import { NextResponse } from "next/server";

import testData from "@/lib/e2e/fixtures/test-data.json";

export const runtime = "nodejs";

function fixturesEnabled() {
  return process.env.E2E_FIXTURES === "true";
}

const SEED_PATIENT = {
  id: "patient-seed-1",
  display_label: testData.patient.displayLabel,
  external_ref: testData.patient.externalRef,
  meta: {
    notes: testData.patient.notes,
    diagnosis: testData.patient.diagnosis,
  },
  created_by: "e2e-user-id",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

export async function GET(_req: Request, ctx: { params: Promise<{ patientId: string }> }) {
  if (!fixturesEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { patientId } = await ctx.params;
  if (patientId !== SEED_PATIENT.id) {
    return NextResponse.json({ patient: null }, { status: 404 });
  }

  return NextResponse.json({ patient: SEED_PATIENT });
}
