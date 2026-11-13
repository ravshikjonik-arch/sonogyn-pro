import type { QuizBank } from "@/lib/education/quiz-bank-types";

/**
 * Самопроверка по маршрутам УЗИ/АГ, ориентированным на RCOG Green-top + ISUOG/КР.
 * Не цитирует полный текст PDF RCOG — учебные сценарии CDS.
 */
export const RCOG_GREEN_TOP_QUIZ_BANK: QuizBank = {
  topic: "RCOG Green-top · маршруты УЗИ/АГ",
  version: "2026-11",
  lastReviewed: "2026-11-06",
  sources: [
    {
      id: "rcog-browse",
      title: "RCOG Green-top Guidelines (catalog)",
      year: 2024,
    },
    {
      id: "rcog-gtg-31",
      title: "RCOG · SGA / FGR (GTG 31) — orient",
      year: 2024,
    },
    {
      id: "rcog-gtg-27a",
      title: "RCOG · Placenta praevia / accreta (GTG 27a) — orient",
      year: 2018,
    },
    {
      id: "rcog-gtg-21",
      title: "RCOG · Ectopic pregnancy (GTG 21) — orient",
      year: 2016,
    },
    {
      id: "rcog-gtg-75",
      title: "RCOG · Cervical cerclage (GTG 75) — orient",
      year: 2022,
    },
    {
      id: "isuog-fgr",
      title: "ISUOG · Fetal growth restriction",
      year: 2020,
    },
    {
      id: "orads-2022",
      title: "ACR O-RADS US v2022",
      year: 2022,
    },
    {
      id: "kr-rf",
      title: "КР Минздрава РФ (приоритет для РФ)",
      year: 2024,
    },
  ],
  questions: [
    {
      id: "rcog-q1",
      category: "Prenatal",
      level: "doctor",
      question:
        "При подозрении на ЗВУР / SGA на УЗИ III триместра наиболее полный «рабочий» набор в кабинете:",
      options: [
        "Только БПР",
        "Фетометрия + EFW/перцентили + AFI + допплер по показаниям",
        "Только ЧСС",
        "Только шейка матки",
      ],
      correctIndex: 1,
      explanation:
        "Маршрут SGA/FGR (ориентир RCOG GTG 31 + ISUOG): биометрия/рост, воды, допплер. В SonoGyn — FMF III / допплер / Guided. Тактика — по КР РФ и ЛПУ.",
      sourceId: "rcog-gtg-31",
    },
    {
      id: "rcog-q2",
      category: "Prenatal",
      level: "student",
      question: "Окно III скринингового срока в SonoGyn (продуктовый стандарт) — это:",
      options: ["11–13+6", "18–22", "34–36 нед", "Только ≥40 нед"],
      correctIndex: 2,
      explanation: "В продукте III скрининговый срок задан как 34–36 нед.; 30–34 больше не используется как ярлык окна.",
      sourceId: "kr-rf",
    },
    {
      id: "rcog-q3",
      category: "Obstetrics",
      level: "doctor",
      question:
        "При низко расположенной плаценте / подозрении на PAS (accreta spectrum) на УЗИ важно:",
      options: [
        "Не описывать расстояние до зева",
        "Оценить отношение к внутреннему зеву и признаки PAS; при сомнении — TV",
        "Только измерить КТР",
        "Только AFI",
      ],
      correctIndex: 1,
      explanation:
        "Ориентир RCOG GTG 27a: локализация плаценты относительно зева и признаки врастания. Решение — мультидисциплинарно; формулировки CDS — справочно.",
      sourceId: "rcog-gtg-27a",
    },
    {
      id: "rcog-q4",
      category: "Obstetrics",
      level: "doctor",
      question: "Ваза превиа на УЗИ в первую очередь ищут как:",
      options: [
        "Утолщение миометрия дна матки",
        "Сосуды поверх внутреннего зева (цветной допплер)",
        "Отсутствие желточного мешка",
        "Полип эндометрия",
      ],
      correctIndex: 1,
      explanation: "GTG 27b / клинический red flag: сосуды поверх зева; риск при velamentous / bilobed placenta.",
      sourceId: "rcog-gtg-27a",
    },
    {
      id: "rcog-q5",
      category: "Early pregnancy",
      level: "doctor",
      question: "При боли / кровотечении в раннем сроке и неясной локализации ПЯ приоритет УЗИ:",
      options: [
        "Только фетометрия III триместра",
        "Исключить эктопию / PUL: полость матки, аднекса, free fluid",
        "Только цервикометрия",
        "Только O-RADS яичника без осмотра матки",
      ],
      correctIndex: 1,
      explanation:
        "Ориентир RCOG GTG 21 + сценарий «малый срок» FMF/Guided. Не диагноз — маршрутизация и локальный протокол.",
      sourceId: "rcog-gtg-21",
    },
    {
      id: "rcog-q6",
      category: "Obstetrics",
      level: "student",
      question: "Цервикометрия при угрозе ПР / оценке показаний к серкляжу выполняется:",
      options: [
        "Только трансабдоминально без измерения длины",
        "Трансвагинально: длина шейки (CL), funneling",
        "Только через прямую кишку",
        "Не нужна при сроке >20 нед никогда",
      ],
      correctIndex: 1,
      explanation: "Ориентир RCOG GTG 75 + вкладка «Цервикометрия» в FMF. Пороги и тактика — по КР РФ/ЛПУ.",
      sourceId: "rcog-gtg-75",
    },
    {
      id: "rcog-q7",
      category: "Gynecology",
      level: "doctor",
      question:
        "Подозрительное образование яичника у пременопаузы в SonoGyn стратифицируют в первую очередь по:",
      options: [
        "Только тексту RCOG GTG 62 без калькулятора",
        "ACR O-RADS US v2022 (калькулятор продукта)",
        "Только BI-RADS МЖ",
        "Только TI-RADS ЩЖ",
      ],
      correctIndex: 1,
      explanation:
        "RCOG GTG 62 — UK-контекст; в продукте единый движок — O-RADS US v2022. Green-top не заменяет ACR-стратификацию в SonoGyn.",
      sourceId: "orads-2022",
    },
    {
      id: "rcog-q8",
      category: "General",
      level: "student",
      question: "Для врача в РФ при расхождении RCOG и российских документов приоритет:",
      options: [
        "Всегда только RCOG",
        "КР Минздрава РФ и локальный протокол ЛПУ; RCOG — международный ориентир",
        "Только учебник без ссылок",
        "Только Instagram-разборы",
      ],
      correctIndex: 1,
      explanation: "Дисклеймер хаба SonoGyn: сначала КР РФ / ДЗМ / ЛПУ; Green-top — UK reference рядом с ISUOG.",
      sourceId: "kr-rf",
    },
    {
      id: "rcog-q9",
      category: "Prenatal",
      level: "student",
      question: "Монохориальная двойня: хориальность надёжнее всего устанавливают:",
      options: [
        "Только в III триместре по весу плодов",
        "В I триместре (ранний / скрининговый срок)",
        "Только после родов",
        "Не определяют никогда",
      ],
      correctIndex: 1,
      explanation: "Ориентир RCOG GTG 51 + ISUOG twins: хориальность — ранний срок; далее surveillance / TTTS.",
      sourceId: "rcog-browse",
    },
    {
      id: "rcog-q10",
      category: "Obstetrics",
      level: "doctor",
      question: "Жалоба на снижение шевелений — роль УЗИ в маршруте чаще включает:",
      options: [
        "Только осмотр шейки без плода",
        "Оценку плода: биометрия / AFI / допплер по ситуации + клинический алгоритм ЛПУ",
        "Только маммографию",
        "Только гистероскопию",
      ],
      correctIndex: 1,
      explanation: "Ориентир RCOG GTG 57 (RFM): УЗИ — часть обследования; не заменяет локальный алгоритм «шевеления».",
      sourceId: "rcog-browse",
    },
    {
      id: "rcog-q11",
      category: "Early pregnancy",
      level: "student",
      question: "В SonoGyn раздел FMF для эктопии / малого срока — это вкладка:",
      options: ["III скрининговый срок", "Малый срок", "Только O-RADS", "Только BI-RADS"],
      correctIndex: 1,
      explanation: "Вкладка «Малый срок» + Guided early; crosswalk с RCOG GTG 21 на хабе Green-top.",
      sourceId: "rcog-gtg-21",
    },
    {
      id: "rcog-q12",
      category: "General",
      level: "student",
      question: "Полный текст Green-top PDF в приложении SonoGyn:",
      options: [
        "Копируется целиком для offline",
        "Не копируется: карточки + ссылка на rcog.org.uk",
        "Переводится машинно без ссылки",
        "Заменяет КР РФ автоматически",
      ],
      correctIndex: 1,
      explanation: "Авторские права RCOG: в продукте — метаданные, УЗИ-ориентиры и официальная ссылка.",
      sourceId: "rcog-browse",
    },
  ],
};
