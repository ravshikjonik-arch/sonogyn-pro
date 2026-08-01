import type { TutorLevel, TutorQuestionContext, TutorResponse } from "./schema";

export const TUTOR_DISCLAIMER_RU =
  "Учебное объяснение SonoGyn Pro. Не диагноз и не замена клинической интерпретации специалиста.";

function optionLabel(index: number, options: string[]): string {
  const letter = String.fromCharCode(65 + index);
  return `${letter}. ${options[index] ?? ""}`.trim();
}

function levelHint(level: TutorLevel): string {
  if (level === "doctor") {
    return "Сфокусируйтесь на дифференциальной логике и следующем шаге протокола.";
  }
  if (level === "resident") {
    return "Свяжите признак с клиническим алгоритмом и типичными ловушками.";
  }
  return "Сначала запомните ключевой признак и правильный ответ, затем разберите почему другие варианты слабее.";
}

function buildWhyWrong(question: TutorQuestionContext): string | null {
  const selected = question.userSelectedIndex;
  if (selected == null || selected === question.correctIndex) return null;
  const wrong = optionLabel(selected, question.options);
  const right = optionLabel(question.correctIndex, question.options);
  return `Вы выбрали «${wrong}». Верный ответ — «${right}». ${question.explanation}`;
}

function buildFollowUps(question: TutorQuestionContext, level: TutorLevel): string[] {
  const base = [
    "Какой следующий срез/шаг протокола подтвердит эту находку?",
    "Какие признаки помогают отличить близкие дифференциальные диагнозы?",
  ];
  if (level === "doctor") {
    base.push("Как сформулировать фразу для протокола без избыточной категоричности?");
  } else {
    base.push("Какой источник/гайдлайн закрепляет этот признак?");
  }
  if (question.mediaCaption) {
    base.unshift("Что именно на учебной схеме соответствует правильному ответу?");
  }
  return base.slice(0, 4);
}

/** Rule-first Explain — works without LLM; uses bank explanation + structured pedagogy. */
export function buildRuleFirstExplain(
  question: TutorQuestionContext,
  level: TutorLevel,
): TutorResponse {
  const correct = optionLabel(question.correctIndex, question.options);
  const whyWrong = buildWhyWrong(question);
  const citations = question.sourceTitle
    ? [{ title: question.sourceTitle, year: question.sourceYear }]
    : [];

  const keyPoints = [
    `Правильный ответ: ${correct}`,
    question.explanation,
    levelHint(level),
  ];
  if (question.mediaCaption) {
    keyPoints.push(`Учебная схема: ${question.mediaCaption}`);
  }

  const answerParts = [
    `Вопрос: ${question.stem}`,
    "",
    `Ответ: ${correct}`,
    "",
    question.explanation,
  ];
  if (whyWrong) {
    answerParts.push("", `Разбор ошибки: ${whyWrong}`);
  }
  answerParts.push("", levelHint(level));

  return {
    mode: "explain",
    answer: answerParts.join("\n").trim(),
    keyPoints,
    citations,
    followUpQuestions: buildFollowUps(question, level),
    whyWrong,
    disclaimer: TUTOR_DISCLAIMER_RU,
    meta: {
      pipeline: "rule-first",
      assistive: true,
      level,
      noPhi: true,
    },
  };
}

/** System prompt for optional LLM deepen (server-side only). */
export function buildExplainSystemPrompt(level: TutorLevel): string {
  return [
    "Ты AI Tutor SonoGyn Pro для врачей УЗИ и АГ / ординаторов / студентов.",
    "Режим: Explain. Только учебное объяснение по гайдлайнам и переданному контексту вопроса.",
    "Не ставь клинический диагноз пациенту. Не запрашивай и не используй PHI.",
    "Отвечай на русском. Кратко, структурировано.",
    `Уровень аудитории: ${level}.`,
    "Верни ТОЛЬКО JSON-объект с полями:",
    'answer (string), keyPoints (string[]), followUpQuestions (string[]), whyWrong (string|null).',
    "Не выдумывай источники сверх переданных. Если данных мало — скажи об этом.",
  ].join("\n");
}

export function buildExplainUserPrompt(question: TutorQuestionContext, level: TutorLevel): string {
  return JSON.stringify(
    {
      level,
      question: {
        stem: question.stem,
        options: question.options,
        correctIndex: question.correctIndex,
        bankExplanation: question.explanation,
        sourceTitle: question.sourceTitle ?? null,
        sourceYear: question.sourceYear ?? null,
        userSelectedIndex: question.userSelectedIndex ?? null,
        mediaCaption: question.mediaCaption ?? null,
        topic: question.topic ?? null,
      },
      task: "Расширь учебное объяснение, сохранив верный ответ и осторожную CDS-формулировку.",
    },
    null,
    2,
  );
}

export function mergeLlmExplain(
  base: TutorResponse,
  llm: {
    answer?: string;
    keyPoints?: string[];
    followUpQuestions?: string[];
    whyWrong?: string | null;
  },
): TutorResponse {
  return {
    ...base,
    answer: llm.answer?.trim() || base.answer,
    keyPoints: llm.keyPoints?.length ? llm.keyPoints.slice(0, 8) : base.keyPoints,
    followUpQuestions: llm.followUpQuestions?.length
      ? llm.followUpQuestions.slice(0, 5)
      : base.followUpQuestions,
    whyWrong: llm.whyWrong === undefined ? base.whyWrong : llm.whyWrong,
    meta: {
      ...base.meta,
      pipeline: "llm-explain",
    },
  };
}
