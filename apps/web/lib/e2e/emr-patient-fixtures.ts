/** Synthetic EMR patients for CI stub IDOR tests only (never real PHI). */

export type E2eEmrPatientRow = {
  id: string;
  display_label: string;
  external_ref: string | null;
  meta: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export const E2E_EMR_PATIENTS: E2eEmrPatientRow[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    display_label: "Stub patient (doctor owner)",
    external_ref: null,
    meta: { notes: "e2e stub" },
    created_by: "e2e-user-id",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    display_label: "Stub patient (admin owner)",
    external_ref: null,
    meta: { notes: "e2e stub" },
    created_by: "e2e-admin-id",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  },
];

export function listE2eEmrPatientsForUser(userId: string): E2eEmrPatientRow[] {
  return E2E_EMR_PATIENTS.filter((p) => p.created_by === userId);
}

export function getE2eEmrPatientForUser(
  patientId: string,
  userId: string,
): E2eEmrPatientRow | null {
  return (
    E2E_EMR_PATIENTS.find((p) => p.id === patientId && p.created_by === userId) ?? null
  );
}
