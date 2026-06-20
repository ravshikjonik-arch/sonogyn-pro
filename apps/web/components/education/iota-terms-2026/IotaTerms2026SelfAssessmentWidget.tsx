"use client";

import { SelfAssessmentWidget } from "@/components/education/SelfAssessmentWidget";
import {
  getIotaTerms2026QuizBank,
  IOTA_TERMS_2026_QUIZ_DISCLAIMER,
  IOTA_TERMS_2026_QUIZ_LINKS,
} from "@/lib/education/iota-terms-2026/quiz";

const STORAGE_KEY = "sonogyn-iota-terms-2026-quiz-progress";

export function IotaTerms2026SelfAssessmentWidget({ className }: { className?: string }) {
  const bank = getIotaTerms2026QuizBank();
  const total = bank.questions.length;
  const studentCount = bank.questions.filter((q) => q.level === "student").length;
  const doctorCount = bank.questions.filter((q) => q.level === "doctor").length;

  return (
    <SelfAssessmentWidget
      bank={bank}
      storageKey={STORAGE_KEY}
      title="IOTA 2026 · самопроверка"
      description={`${total} вопросов (${studentCount} для студента, ${doctorCount} для врача): солидный компонент, тип поражения, папилляр, color score, ADNEX. Данные локальные.`}
      disclaimer={IOTA_TERMS_2026_QUIZ_DISCLAIMER}
      relatedLinks={[
        IOTA_TERMS_2026_QUIZ_LINKS.calculator,
        IOTA_TERMS_2026_QUIZ_LINKS.evidence,
        IOTA_TERMS_2026_QUIZ_LINKS.library,
      ]}
      className={className}
    />
  );
}
