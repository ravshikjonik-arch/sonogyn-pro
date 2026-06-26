import type { QuizBank } from "@/lib/education/quiz-bank-types";

import quizBankJson from "./quiz-bank.json";

export function getIotaTerms2026QuizBank(): QuizBank {
  return quizBankJson as QuizBank;
}

export const IOTA_TERMS_2026_QUIZ_DISCLAIMER =
  "Самопроверка по консенсусу IOTA 2026 — образовательная. Не заменяет официальный документ Wiley/ISUOG и не является медицинским диагнозом.";

export const IOTA_TERMS_2026_QUIZ_LINKS = {
  evidence: { href: "/evidence?shelf=onco", label: "SonoEvidence · онкология" },
  calculator: { href: "/tools/calc/rads/o-rads", label: "O-RADS Pro + IOTA 2026" },
  library: { href: "/tools/refs", label: "Библиотека" },
} as const;
