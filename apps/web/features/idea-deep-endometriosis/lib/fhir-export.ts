import type { IdeaExaminationPayload } from "./schema";

/** Упрощённый FHIR R4 Bundle для демонстрации обмена — не сертифицированный экспорт МИС. */
export function examinationToFhirBundle(exam: IdeaExaminationPayload): Record<string, unknown> {
  const id = `idea-${exam.examDate}-${exam.patientId || "unknown"}`.replace(/\s+/g, "-");
  return {
    resourceType: "Bundle",
    type: "document",
    identifier: { value: id },
    entry: [
      {
        fullUrl: "urn:uuid:diagnostic-report",
        resource: {
          resourceType: "DiagnosticReport",
          status: "preliminary",
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "11526-1",
                display: "US Pelvis",
              },
            ],
            text: "Структурированный лист IDEA (глубокий эндометриоз), УЗИ малого таза",
          },
          subject: { reference: exam.patientId ? `Patient/${exam.patientId}` : "Patient/unknown" },
          effectiveDateTime: exam.examDate,
          performer: exam.sonographerId
            ? [{ display: exam.sonographerId }]
            : undefined,
          conclusion: "Зафиксированы структурированные данные протокола IDEA — см. Observation.",
        },
      },
      {
        fullUrl: "urn:uuid:observation-idea",
        resource: {
          resourceType: "Observation",
          status: "final",
          code: { text: "IDEA JSON payload" },
          component: [
            {
              code: { text: "payload" },
              valueString: JSON.stringify({
                step1: exam.step1,
                step2: exam.step2,
                step3: exam.step3,
                step4: exam.step4,
              }),
            },
          ],
        },
      },
    ],
  };
}
