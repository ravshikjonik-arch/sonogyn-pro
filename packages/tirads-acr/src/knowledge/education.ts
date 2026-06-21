/** Flashcards / quiz — образовательный режим ACR TI-RADS. */

export type TiradsFlashcard = {
  id: string;
  descriptor: string;
  questionRu: string;
  answerRu: string;
  points?: number;
  pitfallRu?: string;
};

export const TIRADS_FLASHCARDS: TiradsFlashcard[] = [
  {
    id: "fc-shape",
    descriptor: "Shape",
    questionRu: "Сколько баллов даёт taller-than-wide?",
    answerRu: "3 балла — один из сильнейших предикторов PTC.",
    points: 3,
    pitfallRu: "Не путать с round wider-than-tall (0 баллов).",
  },
  {
    id: "fc-punctate",
    descriptor: "Echogenic foci",
    questionRu: "Пунктатные echogenic foci без shadowing?",
    answerRu: "3 балла — подозрение на микрокальцинаты PTC.",
    points: 3,
    pitfallRu: "Comet-tail colloid = 0 баллов.",
  },
  {
    id: "fc-spongiform",
    descriptor: "Composition",
    questionRu: "Spongiform узел — сколько баллов composition?",
    answerRu: "0 баллов → типично TR2.",
    points: 0,
  },
  {
    id: "fc-tr5-threshold",
    descriptor: "FNA",
    questionRu: "TR5: порог FNA по ACR?",
    answerRu: "FNA ≥1,0 см; follow-up ≥0,5 см.",
  },
  {
    id: "fc-tr3-threshold",
    descriptor: "FNA",
    questionRu: "TR3: порог FNA?",
    answerRu: "FNA ≥2,5 см; follow-up ≥1,5 см.",
  },
];

export const TIRADS_QUIZ = [
  {
    id: "q1",
    stem: "Солидный гипоэхогенный узел, wider-than-tall, smooth, без кальцинатов. Сколько баллов?",
    options: ["0", "2", "3", "4"],
    correctIndex: 3,
    explanation: "Solid(2) + hypoechoic(2) = 4 → TR4.",
  },
  {
    id: "q2",
    stem: "Spongiform узел с comet-tail. TI-RADS?",
    options: ["TR1", "TR2", "TR4", "TR5"],
    correctIndex: 1,
    explanation: "0 points → TR2.",
  },
];
