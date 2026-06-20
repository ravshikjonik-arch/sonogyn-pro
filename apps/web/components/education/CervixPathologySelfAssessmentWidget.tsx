"use client";

import { SelfAssessmentWidget } from "@/components/education/SelfAssessmentWidget";
import {
  CERVIX_PATHOLOGY_QUIZ_DISCLAIMER,
  CERVIX_PATHOLOGY_QUIZ_LINKS,
} from "@/lib/education/cervix-pathology-quiz";
import { getQuizBank } from "@repo/cervix-pathology-reference";

const STORAGE_KEY = "sonogyn-cervix-pathology-quiz-progress";

export function CervixPathologySelfAssessmentWidget({ className }: { className?: string }) {
  const bank = getQuizBank();
  const total = bank.questions.length;
  const studentCount = bank.questions.filter((q) => q.level === "student").length;
  const doctorCount = bank.questions.filter((q) => q.level === "doctor").length;

  return (
    <SelfAssessmentWidget
      bank={bank}
      storageKey={STORAGE_KEY}
      title="Патология шейки матки · самопроверка"
      description={`${total} вопросов (${studentCount} для студента, ${doctorCount} для врача): терминология, скрининг, FIGO 2018, тактика ведения. Данные локальные, без сети.`}
      disclaimer={CERVIX_PATHOLOGY_QUIZ_DISCLAIMER}
      relatedLinks={[
        CERVIX_PATHOLOGY_QUIZ_LINKS.nosology,
        CERVIX_PATHOLOGY_QUIZ_LINKS.evidence,
        CERVIX_PATHOLOGY_QUIZ_LINKS.library,
      ]}
      className={className}
    />
  );
}
