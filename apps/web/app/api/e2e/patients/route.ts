import { NextResponse } from "next/server";

import testData from "@/lib/e2e/fixtures/test-data.json";

export const runtime = "nodejs";

function fixturesEnabled() {
  return process.env.E2E_FIXTURES === "true";
}

const SEED_PATIENTS = [
  {
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
  },
];

export async function GET(req: Request) {
  if (!fixturesEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").toLowerCase();
  const filtered = SEED_PATIENTS.filter(
    (p) =>
      p.display_label.toLowerCase().includes(q) ||
      (p.external_ref ?? "").toLowerCase().includes(q),
  );

  return NextResponse.json({ patients: filtered, nextCursor: null, hasMore: false });
}
