"use client";

import { useState } from "react";

import { CalcStepCard } from "@/components/calculators/shared/calc-ui";
import { Button } from "@/components/ui/button";
import { TIRADS_CATEGORIES, TIRADS_FLASHCARDS, TIRADS_QUIZ } from "@/lib/tirads-acr";

export function TiradsEducationPanel() {
  const [cardIdx, setCardIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [quizIdx, setQuizIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const card = TIRADS_FLASHCARDS[cardIdx]!;
  const quiz = TIRADS_QUIZ[quizIdx]!;

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 lg:px-10">
      <h2 className="text-xl font-black">Обучение · ACR TI-RADS</h2>

      <CalcStepCard title="Категории TR1–TR5">
        <div className="space-y-2">
          {TIRADS_CATEGORIES.map((c) => (
            <div key={c.code} className="rounded-lg border p-2 text-xs">
              <p className="font-bold">{c.label}</p>
              <p>{c.pointsRange} · риск {c.malignancyRisk}</p>
              <p className="text-[var(--clinical-foreground-muted)]">{c.educationRu}</p>
            </div>
          ))}
        </div>
      </CalcStepCard>

      <CalcStepCard title="Flashcard">
        <p className="text-sm font-bold">{card.questionRu}</p>
        {showAnswer ? <p className="mt-2 text-sm text-sky-800">{card.answerRu}</p> : null}
        {card.pitfallRu && showAnswer ? <p className="mt-1 text-xs text-amber-800">Pitfall: {card.pitfallRu}</p> : null}
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowAnswer((v) => !v)}>
            {showAnswer ? "Скрыть" : "Ответ"}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setCardIdx((i) => (i + 1) % TIRADS_FLASHCARDS.length);
              setShowAnswer(false);
            }}
          >
            Следующая
          </Button>
        </div>
      </CalcStepCard>

      <CalcStepCard title="Quiz">
        <p className="text-sm font-bold">{quiz.stem}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {quiz.options.map((opt, i) => (
            <Button key={opt} size="sm" variant={selected === i ? "default" : "outline"} onClick={() => setSelected(i)}>
              {opt}
            </Button>
          ))}
        </div>
        {selected !== null ? (
          <p className={`mt-2 text-xs ${selected === quiz.correctIndex ? "text-emerald-700" : "text-rose-700"}`}>
            {selected === quiz.correctIndex ? "Верно." : "Неверно."} {quiz.explanation}
          </p>
        ) : null}
        <Button
          className="mt-2"
          size="sm"
          variant="secondary"
          onClick={() => {
            setQuizIdx((i) => (i + 1) % TIRADS_QUIZ.length);
            setSelected(null);
          }}
        >
          Следующий вопрос
        </Button>
      </CalcStepCard>
    </div>
  );
}
