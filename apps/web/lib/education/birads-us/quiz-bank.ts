import type { QuizBank } from "@/lib/education/quiz-bank-types";

/**
 * Самопроверка US BI-RADS.
 * Смыслы — ACR BI-RADS US + локальный ruleset @repo/birads-us.
 * Не воспроизводит чужие УМП/курсы; не цитирует atlas ACR целиком.
 */
export const BIRADS_US_QUIZ_BANK: QuizBank = {
  topic: "BI-RADS US · самопроверка",
  version: "2026-11",
  lastReviewed: "2026-11-15",
  sources: [
    {
      id: "acr-birads-us",
      title: "ACR BI-RADS Atlas — Ultrasound (assessment categories / lexicon)",
      year: 2013,
      status: "orient",
    },
    {
      id: "sonogyn-birads-us",
      title: "SonoGyn @repo/birads-us (локальный CDS ruleset)",
      year: 2025,
    },
    {
      id: "kr-rf-breast",
      title: "КР МЗ РФ / рубрикатор — сверка тактики для РФ",
      year: 2024,
      status: "orient",
    },
  ],
  questions: [
    {
      id: "birads-q1",
      category: "Access",
      level: "student",
      question: "У женщины 32 лет без симптомов какой метод инструментального обследования МЖ чаще первый?",
      options: [
        "Рентгеновская маммография",
        "УЗИ молочных желёз",
        "Только МРТ",
        "Только пункция",
      ],
      correctIndex: 1,
      explanation:
        "До 40 лет при плотной железистой ткани первичным методом обычно является УЗИ (без ионизирующего излучения). ≥40 — ММГ ± УЗИ по показаниям. Решение — по КР/протоколу ЛПУ.",
      sourceId: "kr-rf-breast",
    },
    {
      id: "birads-q2",
      category: "Lexicon",
      level: "student",
      question: "Что в первую очередь формирует базовую категорию US BI-RADS по очагу?",
      options: [
        "Только эластография",
        "Только ЦДК/ЭДК",
        "Серошкальный B-режим (лексикон признаков)",
        "Только возраст пациентки",
      ],
      correctIndex: 2,
      explanation:
        "Категория строится на стандартизированном описании в B-режиме. Допплер и эластография — мультипараметр: могут повысить подозрительность, но не «отменяют» B-режим.",
      sourceId: "acr-birads-us",
    },
    {
      id: "birads-q3",
      category: "Lexicon",
      level: "student",
      question: "Параллельная (горизонтальная) ориентация очага относительно кожи обычно отражает:",
      options: [
        "Рост вдоль тканевых пластов (ширина ≥ высоты)",
        "Обязательный рак",
        "Только кисту",
        "Обязательную биопсию без других признаков",
      ],
      correctIndex: 0,
      explanation:
        "Параллельная ориентация — признак роста вдоль пластов; чаще ассоциируется с доброкачественным паттерном, но категория — по совокупности признаков лексикона.",
      sourceId: "acr-birads-us",
    },
    {
      id: "birads-q4",
      category: "Categories",
      level: "student",
      question: "По ACR вероятность злокачественности для BI-RADS 3 (US) — это:",
      options: ["> 10% и ≤ 50%", "> 0% и ≤ 2%", "≥ 95%", "2–50%"],
      correctIndex: 1,
      explanation:
        "BI-RADS 3: >0% и ≤2%. Тактика — короткий интервал наблюдения по протоколу; при росте/новых признаках — повышение категории.",
      sourceId: "sonogyn-birads-us",
    },
    {
      id: "birads-q5",
      category: "Protocol",
      level: "student",
      question: "Полный протокол УЗИ МЖ без оценки зон лимфооттока:",
      options: [
        "Считается достаточным, если очагов нет",
        "Клинически неполноценен — аксилла / под- и надключичные зоны входят в осмотр",
        "Нужен только при BI-RADS 5",
        "Заменяется только эластографией",
      ],
      correctIndex: 1,
      explanation:
        "Осмотр регионарных зон лимфооттока — обязательная часть исследования МЖ. Находки ЛУ влияют на маршрутизацию.",
      sourceId: "acr-birads-us",
    },
    {
      id: "birads-q6",
      category: "Multiparametric",
      level: "doctor",
      question:
        "Очаг в B-режиме оценён как BI-RADS 4A. Эластография «мягкая», ЦДК без локусов. Корректная тактика категории:",
      options: [
        "Снизить до BI-RADS 3",
        "Снизить до BI-RADS 2",
        "Не снижать: допплер/эласто не отменяют подозрительность B-режима",
        "Сразу BI-RADS 6",
      ],
      correctIndex: 2,
      explanation:
        "Мультипараметр может повысить категорию при жёсткости/пенетрирующем кровотоке, но не должен снижать категорию, выставленную по подозрительным признакам B-режима.",
      sourceId: "sonogyn-birads-us",
    },
    {
      id: "birads-q7",
      category: "Categories",
      level: "doctor",
      question: "Диапазон вероятности злокачественности ACR для BI-RADS 4B:",
      options: ["> 2% и ≤ 10%", "> 10% и ≤ 50%", "> 50% и < 95%", "50–75%"],
      correctIndex: 1,
      explanation:
        "ACR: 4A >2–≤10%; 4B >10–≤50%; 4C >50–<95%; 5 ≥95%. Иные «учебные» проценты в продукт не берём.",
      sourceId: "sonogyn-birads-us",
    },
    {
      id: "birads-q8",
      category: "Categories",
      level: "doctor",
      question: "Какой набор ближе к классическому паттерну BI-RADS 5 (US)?",
      options: [
        "Овальный узел, параллельный коже, чёткий ровный край",
        "Вертикальная ориентация, лучистый/спикулообразный край, центральная акустическая тень",
        "Простая тонкостенная киста с дорсальным усилением",
        "Стабильная типичная фиброаденома много лет",
      ],
      correctIndex: 1,
      explanation:
        "BI-RADS 5 — высокая совокупность подозрительных признаков (≥95% вероятность по ACR). Морфологическая верификация и маршрутизация к онкологу — по протоколу.",
      sourceId: "acr-birads-us",
    },
    {
      id: "birads-q9",
      category: "Categories",
      level: "doctor",
      question: "BI-RADS 0 на УЗИ чаще означает:",
      options: [
        "Подтверждённый рак",
        "Неполное исследование / нужна корреляция (например ММГ) до финальной категории",
        "Обязательную мастэктомию",
        "Норму без очагов",
      ],
      correctIndex: 1,
      explanation:
        "0 — assessment incomplete: недостаточно данных для финальной категории (артефакты, нужна ММГ/архив и т.п.).",
      sourceId: "acr-birads-us",
    },
    {
      id: "birads-q10",
      category: "Practice",
      level: "doctor",
      question: "В SonoGyn Pro заключение калькулятора BI-RADS следует трактовать как:",
      options: [
        "Окончательный диагноз РМЖ",
        "Справочный CDS-ориентир; интерпретация и тактика — за врачом и протоколом ЛПУ",
        "Замену трепан-биопсии",
        "Юридически значимое заключение без осмотра",
      ],
      correctIndex: 1,
      explanation:
        "Платформа — clinical decision support и обучение. Не мед. изделие с функцией диагноза; решение принимает специалист.",
      sourceId: "sonogyn-birads-us",
    },
  ],
};
