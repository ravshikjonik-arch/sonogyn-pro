import type { Metadata } from "next";

import { MyomaQuizClient, type MyomaQuizItem } from "@/components/education/myoma/MyomaQuizClient";
import { myomaQuiz } from "@repo/myoma-education";

export const metadata: Metadata = {
  title: "Тест: миома матки | SonoGyn Pro",
  description: "Самопроверка по учебным модулям ультразвуковой диагностики миомы матки.",
  robots: { index: false, follow: false },
};

export default function MyomaQuizPage() {
  const questions: MyomaQuizItem[] = myomaQuiz.questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    type: question.type === "single" ? "single" : "boolean",
    correct: question.correct,
    explanation: question.explanation,
    moduleId: question.moduleId,
    options: "options" in question ? question.options : undefined,
  }));

  return (
    <MyomaQuizClient
      title={myomaQuiz.title}
      passScorePercent={myomaQuiz.passScorePercent}
      questions={questions}
    />
  );
}
