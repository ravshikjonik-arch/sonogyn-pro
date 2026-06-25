import type { VascularGlossaryEntry, VascularQuizQuestion } from "./types";
import type { QuizBank } from "@/lib/education/quiz-bank-types";
import { VASCULAR_US_SOURCE } from "./constants";

export const VASCULAR_US_GLOSSARY: VascularGlossaryEntry[] = [
  { term: "PSV", aliases: ["peak systolic velocity"], definition: "Пиковая систолическая скорость кровотока (см/с).", sectionIds: ["hemodynamics", "extracranial"] },
  { term: "RI", definition: "Индекс резистентности: (PSV−EDV)/PSV.", sectionIds: ["hemodynamics"] },
  { term: "PI", definition: "Индекс пульсации.", sectionIds: ["hemodynamics"] },
  { term: "ИМТ", aliases: ["IMT", "ТИМ"], definition: "Intima-media thickness — толщина комплекса интима-медиа.", sectionIds: ["extracranial"] },
  { term: "ICA/CCA ratio", definition: "Отношение PSV внутренней сонной к общей сонной.", sectionIds: ["extracranial"] },
  { term: "ECST", definition: "European Carotid Surgery Trial — стеноз по диаметру в месте бляшки.", sectionIds: ["extracranial"] },
  { term: "NASCET", definition: "North American Symptomatic Carotid Endarterectomy Trial — стеноз относительно дистальной ВСА.", sectionIds: ["extracranial"] },
  { term: "Subclavian steal", definition: "Ретроградный поток в позвоночной артерии при стenosis подключичной.", sectionIds: ["upper-limb", "extracranial"] },
  { term: "RAR", definition: "Renal-aortic ratio — отношение PSV почечной артерии к аорте.", sectionIds: ["abdominal-aorta"] },
  { term: "Компрессия вены", definition: "Gold standard для исключения острого тромбоза глубоких вен.", sectionIds: ["lower-limb-veins"] },
];

export const VASCULAR_US_QUIZ: VascularQuizQuestion[] = [
  {
    id: "q1",
    sectionId: "extracranial",
    question: "PSV ВСА 240 см/с при типичной бляшке — наиболее вероятная градация:",
    options: ["<50%", "50–69%", "70–99%", "Окклюзия"],
    correctIndex: 2,
    explanation: "PSV ≥230 см/с — выраженный стеноз (≥70%) по табл. 4.1 (Grant/SVU).",
  },
  {
    id: "q2",
    sectionId: "lower-limb-veins",
    question: "Главный критерий острого тромбоза глубокой вены:",
    options: ["Рефлюкс >0.5 с", "Неполная компрессия просвета", "Дилатация БПВ", "Monophasic спектр"],
    correctIndex: 1,
    explanation: "Loss of compressibility — primary sign of acute DVT.",
  },
  {
    id: "q3",
    sectionId: "hemodynamics",
    question: "Турбulent flow distal to stenosis отражает:",
    options: ["Нормальную laminar flow", "Post-stenotic turbulence", "Venous congestion", "Artifact only"],
    correctIndex: 1,
    explanation: "Локальное повышение скорости и турбулентность — post-stenotic pattern.",
  },
  {
    id: "q4",
    sectionId: "extracranial",
    question: "ICA/CCA ratio ≥2.0 чаще соответствует:",
    options: ["<50%", "≥50%", "Normal only", "Venous flow"],
    correctIndex: 1,
    explanation: "Ratio ≥2 — criterion for ≥50% stenosis (табл. 4.1).",
  },
  {
    id: "q5",
    sectionId: "extracranial",
    question: "ТИМ ОСА 1,2 мм при отсутствии бляшки по Куликову:",
    options: ["Норма", "Начальный атеросклероз", "Мелкая АСБ", "Окклюзия"],
    correctIndex: 1,
    explanation: ">1 мм — патологически увеличенная ТИМ; 1–1,5 мм — начальный атеросклероз.",
  },
  {
    id: "q6",
    sectionId: "extracranial",
    question: "Локальное утолщение ТИМ 1,6 мм без стеноза — по Mannheim:",
    options: ["Норма", "Увеличенная ТИМ", "АСБ", "Диссекция"],
    correctIndex: 2,
    explanation: "Локальное увеличение ТИМ >1,5 мм — атеросклеротическая бляшка.",
  },
  {
    id: "q7",
    sectionId: "extracranial",
    question: "Диаметр ПА 1,7 мм, высокорезистентный низкоскоростной спектр:",
    options: ["Норма", "Гипоплазия", "Спазм", "Окклюзия"],
    correctIndex: 1,
    explanation: "Диаметр <2,5 мм + типичный спектр — гипоплазия; спазм — проба с гиперкапнией.",
  },
  {
    id: "q8",
    sectionId: "extracranial",
    question: "Асимметрия АД на руках 22 мм рт.ст. — что проверить в первую очередь:",
    options: ["ТИМ ОСА", "Стил-синдром / ПКА", "ВЯВ", "НСА"],
    correctIndex: 1,
    explanation: "Асимметрия >15 мм — тест на стил-синдром; манжеточная проба на ПА.",
  },
  {
    id: "q9",
    sectionId: "extracranial",
    question: "PSV ВСА 180 см/с, EDV 45 см/с, ICA/CCA 2,5 — градация:",
    options: ["<50%", "50–69%", ">70%", "Недостаточно данных"],
    correctIndex: 1,
    explanation: "125–230 см/с и ratio 2,0–4,0 — умеренный стеноз 50–69%.",
  },
  {
    id: "q10",
    sectionId: "extracranial",
    question: "ECST 70% примерно соответствует NASCET:",
    options: ["70%", "50%", "90%", "30%"],
    correctIndex: 1,
    explanation: "ECST завышает степень; 70% ECST ≈ 50% NASCET (Куликов).",
  },
  {
    id: "q11",
    sectionId: "extracranial",
    question: "Флебэктазия ВЯВ по Куликову:",
    options: ["Диаметр = ОСА", "Диаметр >3× ОСА", "Vmax >125 см/с", "Рефлюкс <0,5 с"],
    correctIndex: 1,
    explanation: "Просвет ВЯВ >3 размеров ОСА на уровне перстневидного хряща.",
  },
  {
    id: "q12",
    sectionId: "extracranial",
    question: "Ретроградный поток по глазной артерии; компрессия НСА не меняет картину:",
    options: ["Окклюзия ВСА", "Глазной анастомоз не функционирует", "Норма", "Тромбоз ВЯВ"],
    correctIndex: 1,
    explanation: "При функционирующем анастомозе компрессия НСА резко меняет поток по глазной артерии.",
  },
  {
    id: "q13",
    sectionId: "tcd",
    question: "Lindegaard ratio используют при:",
    options: ["Carotid stenosis", "Vasospasm после SAH", "DVT", "AAA"],
    correctIndex: 1,
    explanation: "MCA velocity / extracranial ICA — vasospasm monitoring.",
  },
  {
    id: "q14",
    sectionId: "lower-limb-arteries",
    question: "Monophasic waveform в артерии голени чаще указывает на:",
    options: ["Норму", "Проксимальный стеноз/окклюзию", "Варикоз", "Рефлюкс"],
    correctIndex: 1,
    explanation: "Дистальный monophasic pattern — проксимальное артериальное поражение.",
  },
  {
    id: "q15",
    sectionId: "upper-limb",
    question: "Полный стил-синдром при окклюзии I сегмента ПКА — кровоток в ПА:",
    options: ["Антеградный", "Ретроградный", "Отсутствует", "Venous"],
    correctIndex: 1,
    explanation: "Окклюзия проксимальной ПКА — устойчивый ретроградный поток в ПА.",
  },
  {
    id: "q16",
    sectionId: "abdominal-aorta",
    question: "RAR >3,5 чаще указывает на:",
    options: ["Норму", "Стеноз почечной артерии", "ТГВ", "Аневризму без значимости"],
    correctIndex: 1,
    explanation: "Elevated RAR — hemodynamically significant renal artery stenosis.",
  },
  {
    id: "q17",
    sectionId: "lower-limb-arteries",
    question: "ЛПИ 0,75 при типичной клинике ишемии — интерпретация:",
    options: ["Норма", "Стеноокклюзирующее поражение", "Венозный рефлюкс", "Spasm only"],
    correctIndex: 1,
    explanation: "ЛПИ <0,9 — патологическое снижение периферического притока (гл. 6).",
  },
  {
    id: "q18",
    sectionId: "lower-limb-arteries",
    question: "PSV в стенозе ОБА 250 см/с, проксимально 80 см/с — наиболее вероятно:",
    options: ["<20%", "20–49%", "50–74%", "75–99%"],
    correctIndex: 2,
    explanation: "PSV 200–400 см/с соответствует стенозу 50–74% по табл. 6.1; ИПС ≈3,1.",
  },
];

const SECTION_CATEGORY: Record<string, string> = {
  extracranial: "extracranial",
  hemodynamics: "doppler",
  "lower-limb-veins": "diagnostics",
  "lower-limb-arteries": "diagnostics",
  "upper-limb": "diagnostics",
  tcd: "diagnostics",
  "abdominal-aorta": "diagnostics",
};

export function getVascularUsQuizBank(): QuizBank {
  return {
    topic: "vascular-ultrasound",
    version: "1.2",
    lastReviewed: "2026-06-20",
    sources: [
      {
        id: "kulikov-2015",
        title: `${VASCULAR_US_SOURCE.author}, ${VASCULAR_US_SOURCE.title}`,
        year: 2015,
      },
    ],
    questions: VASCULAR_US_QUIZ.map((q) => ({
      id: q.id,
      category: SECTION_CATEGORY[q.sectionId] ?? "diagnostics",
      level: "doctor" as const,
      question: q.question,
      options: q.options,
      correctIndex: q.correctIndex,
      explanation: q.explanation,
      sourceId: "kulikov-2015",
    })),
  };
}

export function searchGlossary(query: string): VascularGlossaryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return VASCULAR_US_GLOSSARY;
  return VASCULAR_US_GLOSSARY.filter((e) => {
    const hay = [e.term, ...(e.aliases ?? []), e.definition].join(" ").toLowerCase();
    return hay.includes(q);
  });
}
