import type { QuizBank } from "./types";
import { safeParseQuizBank } from "./schema";

/** Dev-time bank validation (warns; does not throw). */
export function assertQuizBankInDev(bank: QuizBank, label = "quiz-bank"): QuizBank {
  if (process.env.NODE_ENV === "production") return bank;
  const parsed = safeParseQuizBank(bank);
  if (!parsed.success) {
    console.warn(`[${label}] Zod validation failed`, parsed.error.flatten());
  }
  return bank;
}
