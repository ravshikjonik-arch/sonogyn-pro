export type PhiDetectionResult = {
  ok: boolean;
  reasons: string[];
};

const DETECTORS: Array<{ label: string; pattern: RegExp }> = [
  { label: "email", pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i },
  { label: "телефон", pattern: /(?:\+7|8)\s*(?:\(?\d{3}\)?[\s-]*)\d{3}[\s-]*\d{2}[\s-]*\d{2}\b/ },
  { label: "СНИЛС", pattern: /\b\d{3}[-\s]?\d{3}[-\s]?\d{3}[-\s]?\d{2}\b/i },
  { label: "паспорт", pattern: /\b(?:паспорт|серия\s+и\s+номер)\D{0,20}\d{4}\s?\d{6}\b/i },
  { label: "полис", pattern: /\b(?:омс|полис)\D{0,20}\d{12,16}\b/i },
  { label: "номер карты", pattern: /\b(?:номер\s+карты|мед(?:ицинск(?:ая|ой))?\s+карта|история\s+болезни)\D{0,20}\d{4,}\b/i },
  { label: "дата рождения", pattern: /\b(?:дата\s+рождения|др|dob)\D{0,20}\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/i },
  { label: "ФИО", pattern: /(?:фио|пациент(?:ка)?|patient\s*name)\s*[:—-]\s*[А-ЯA-Z][А-Яа-яA-Za-z-]+(?:\s+[А-ЯA-Z][А-Яа-яA-Za-z-]+){1,2}/i },
];

export function detectPhi(text: string): PhiDetectionResult {
  const reasons = DETECTORS.filter((detector) => detector.pattern.test(text)).map(
    (detector) => detector.label,
  );
  return { ok: reasons.length === 0, reasons };
}

export function detectPhiInUnknown(value: unknown): PhiDetectionResult {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return detectPhi(text ?? "");
}

export const PHI_BLOCK_MESSAGE =
  "Запрос остановлен защитой данных: уберите ФИО, телефон, email, дату рождения, номер карты/полиса/паспорта и отправьте обезличенное описание.";
