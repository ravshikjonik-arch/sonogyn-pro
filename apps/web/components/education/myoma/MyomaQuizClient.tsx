"use client";

import { useState } from "react";

import { MyomaChrome } from "@/components/education/myoma/MyomaChrome";
import { useMyomaProgress } from "@/components/education/myoma/use-myoma-progress";

export type MyomaQuizItem = {
  id: string;
  prompt: string;
  type: "boolean" | "single";
  correct: boolean | string;
  explanation: string;
  moduleId: string;
  options?: { id: string; text: string }[];
};

const focus =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]";

function isRight(question: MyomaQuizItem, answer: string): boolean {
  if (question.type === "boolean") return (answer === "true") === question.correct;
  return answer === question.correct;
}

export function MyomaQuizClient({
  title,
  passScorePercent,
  questions,
}: {
  title: string;
  passScorePercent: number;
  questions: MyomaQuizItem[];
}) {
  const { progress, recordQuiz } = useMyomaProgress();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [finished, setFinished] = useState(false);

  const answered = questions.filter((question) => revealed[question.id]).length;
  const correctCount = questions.filter((question) => {
    const answer = answers[question.id];
    return answer != null && revealed[question.id] && isRight(question, answer);
  }).length;
  const score = questions.length === 0 ? 0 : Math.round((correctCount / questions.length) * 100);
  const passed = score >= passScorePercent;

  function choose(question: MyomaQuizItem, answer: string) {
    if (revealed[question.id] || finished) return;
    setAnswers((current) => ({ ...current, [question.id]: answer }));
    setRevealed((current) => ({ ...current, [question.id]: true }));
  }

  function finish() {
    recordQuiz(score);
    setFinished(true);
  }

  function retake() {
    setAnswers({});
    setRevealed({});
    setFinished(false);
  }

  return (
    <MyomaChrome title={title} kicker="Самопроверка">
      <p className="max-w-[72ch] text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
        {questions.length} вопросов. Порог {passScorePercent}%. Пояснение появляется после ответа.
        {progress.quizBestScore != null ? ` Лучший результат в этом браузере: ${progress.quizBestScore}%.` : ""}
      </p>
      <ol className="space-y-4">
        {questions.map((question, index) => {
          const answer = answers[question.id];
          const shown = Boolean(revealed[question.id]);
          const options =
            question.type === "boolean"
              ? [
                  { id: "true", text: "Верно" },
                  { id: "false", text: "Неверно" },
                ]
              : (question.options ?? []);
          return (
            <li key={question.id} className="space-y-3 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4">
              <p className="max-w-[72ch] font-medium text-[var(--clinical-foreground)]">
                {index + 1}. {question.prompt}
              </p>
              <div className="grid gap-2" role="group" aria-label={`Ответ на вопрос ${index + 1}`}>
                {options.map((option) => {
                  const selected = answer === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      disabled={shown}
                      aria-pressed={selected}
                      className={`rounded-xl border px-3 py-2 text-left text-sm ${focus} ${
                        selected ? "border-[var(--clinical-primary)] bg-[var(--clinical-muted)]" : "border-[var(--clinical-border)]"
                      }`}
                      onClick={() => choose(question, option.id)}
                    >
                      {option.text}
                    </button>
                  );
                })}
              </div>
              {shown && answer != null ? (
                <p className="max-w-[72ch] text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
                  {isRight(question, answer) ? "Ответ совпал с учебным ключом. " : "Ответ не совпал с учебным ключом. "}
                  {question.explanation}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={`rounded-full bg-[var(--clinical-muted)] px-4 py-2 text-sm font-semibold ${focus}`}
          disabled={answered !== questions.length || finished}
          onClick={finish}
        >
          Показать итог
        </button>
        {finished ? (
          <button type="button" className={`rounded-full border border-[var(--clinical-border)] px-4 py-2 text-sm font-semibold ${focus}`} onClick={retake}>
            Пройти ещё раз
          </button>
        ) : null}
      </div>
      {finished ? (
        <p className="max-w-[72ch] text-sm leading-relaxed text-[var(--clinical-foreground)]" role="status">
          {correctCount} из {questions.length} · {score}%.{" "}
          {passed
            ? `Порог самопроверки ${passScorePercent}% пройден.`
            : `Ниже порога ${passScorePercent}%. Можно пройти ещё раз.`}
        </p>
      ) : (
        <p className="text-sm text-[var(--clinical-foreground-muted)]">Отвечено {answered} из {questions.length}</p>
      )}
    </MyomaChrome>
  );
}
