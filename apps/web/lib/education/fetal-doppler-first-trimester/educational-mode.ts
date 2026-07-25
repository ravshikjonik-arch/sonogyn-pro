import type { FetalDopplerEducationalCard } from "./types";

/** SonoGyn-Pro educational mode — per-topic cards (Section 10). */
export const FETAL_DOPPLER_EDUCATIONAL_CARDS: FetalDopplerEducationalCard[] = [
  {
    id: "introduction",
    learningObjectives: [
      "Перечислить 4 клинических показания допплера в 11–14 нед.",
      "Объяснить место допплера в расширенном протоколе FMF.",
      "Назвать ограничения одномаркерной интерпретации.",
    ],
    keyPoints: [
      "Допплер — по показаниям, коротко.",
      "5 позиций — стандарт расширенного протокола.",
      "Контекст: КТР, ТВП, анатомия, анамнез.",
    ],
    clinicalPearls: [
      "Начинайте с B-mode морфологии; допплер — после подтверждения жизнеспособности и базовой анатомии.",
      "Документируйте каждую позицию для последующего расчёта риска.",
    ],
    residentTips: [
      "Держите чек-лист 5 позиций на втором мониторе или в SonoGyn-Pro.",
      "Если одна позиция не получается — не «залипайте»; вернитесь после смены положения матери.",
    ],
    examPearls: [
      "«Зачем допплер в 11–14?» — функциональные маркеры + UTA PI + SUA + АБП.",
    ],
    faq: [
      {
        q: "Нужен ли допплер каждому пациенту?",
        a: "Нет. Только по показаниям протокола скрининга или при подозрении на патологию.",
      },
    ],
  },
  {
    id: "safety",
    learningObjectives: [
      "Применить ALARA на практике.",
      "Контролировать TI ≤ 1.0.",
      "Выбрать порядок Color → Pulsed Doppler.",
    ],
    keyPoints: ["TI ≤ 1.0", "5–10 мин на протокол", "Маленький color box"],
    clinicalPearls: [
      "При плохой визуализации меняйте доступ, а не увеличивайте мощность допплера.",
    ],
    residentTips: [
      "Засекайте время допплер-блока — привычка снижает ALARA-нарушения.",
    ],
    examPearls: ["До 11 нед — избегать необоснованного спектрального допплера."],
    faq: [
      {
        q: "Можно ли использовать TV-доступ для допплера?",
        a: "Да, если улучшает визуализацию и сокращает время; соблюдайте ALARA.",
      },
    ],
  },
  {
    id: "fetal-heart",
    learningObjectives: [
      "Выполнить 4CV и 3VT с color doppler.",
      "Оценить наполнение камер.",
      "Знать, когда измерять TR.",
    ],
    keyPoints: ["4CV color в диастолу", "3VT — три сосуда", "TR — по показаниям"],
    clinicalPearls: ["Асимметрия наполнения — повод для детальной кардиологии II триместра."],
    residentTips: ["Color box только на сердце — меньше артефактов и ALARA."],
    examPearls: ["I триместр ≠ полная ЭхоКГ."],
    faq: [
      {
        q: "TR всегда измеряют?",
        a: "Нет — только в расширенном протоколе / по показаниям.",
      },
    ],
  },
  {
    id: "ductus-venosus",
    learningObjectives: [
      "Найти VP color-ом по траектории ПВ → VP → ПП.",
      "Измерить PI и описать A-волну.",
      "Отличить VP от печёnoчных вен.",
    ],
    keyPoints: ["Правый парасагиттальный", "Sample ~1 мм", "A-wave antegrade в норме"],
    clinicalPearls: [
      "Reversed A-wave — red flag; всегда сочетайте с морфологией и генетическим контекстом.",
    ],
    residentTips: ["Если PI «скачет» — проверьте, не захватили ли печёnoчную вену."],
    examPearls: ["PI VP — перцентили FMF / справочник SonoGyn, 11–14 нед."],
    faq: [
      {
        q: "Сколько циклов записывать?",
        a: "Минимум 3 стабильных комплекса, как для других допплер-измерений.",
      },
    ],
  },
  {
    id: "umbilical-arteries",
    learningObjectives: [
      "Идентифицировать 2 артерии и 1 вену у пузыря.",
      "Распознать SUA.",
      "Знать тактику при SUA.",
    ],
    keyPoints: ["Пузырь обязателен в кадре", "2A + 1V = норма", "SUA → расширенный протокол"],
    clinicalPearls: ["SUA без других маркеров не равна автоматической инвазивной диагностике — по протоколу."],
    residentTips: ["Пустой пузырь — подождите наполнения или повторите через 15–20 мин."],
    examPearls: ["Поперечный таз на уровне пузыря — ключевая плоскость."],
    faq: [
      {
        q: "Одна артерия видна — сразу SUA?",
        a: "Подтвердите уровень и повторите; документируйте 2 прохода.",
      },
    ],
  },
  {
    id: "umbilical-ring",
    learningObjectives: [
      "Различить физиологическую грыжу и омфалоцеле.",
      "Отличить гастрошизис от омфалоцеле.",
      "Знать сроки документирования.",
    ],
    keyPoints: ["До 11 нед — физиологическая грыжа возможна", "После 12 нед — оценка кольца", "Мембрана vs free loops"],
    clinicalPearls: ["Гастрошизис — paraumbilical, без мембраны; омфалоцеле — midline, часто с мембраной."],
    residentTips: ["Color на пуповину в зоне дефекта — must have для протокола."],
    examPearls: ["Не ставьте окончательный диагноз грыжи до 12+ нед без контекста."],
    faq: [
      {
        q: "Когда можно закрыть вопрос о грыже?",
        a: "После 12 нед при полной визуализации кольца и передней стенки.",
      },
    ],
  },
  {
    id: "uterine-arteries",
    learningObjectives: [
      "Выполнить протокол PI UTA трансабдоминально.",
      "Соблюсти угол < 30°.",
      "Рассчитать mean PI.",
    ],
    keyPoints: ["Внутренний зев", "3 цикла", "Mean = (R+L)/2"],
    clinicalPearls: ["PI UTA — часть скрининга PE; интегрируйте с факторами матери."],
    residentTips: ["Лёгкий наклон датчика часто лучше, чем «давить» на живот."],
    examPearls: ["Типичная ошибка — iliac artery вместо uterine."],
    faq: [
      {
        q: "TV для UTA?",
        a: "Стандарт — трансабдоминально; TV не заменяет протокол FMF для UTA PI.",
      },
    ],
  },
  {
    id: "five-positions",
    learningObjectives: ["Запомнить порядок 5 позиций", "Связать каждую с клиническим вопросом"],
    keyPoints: ["01 Heart", "02 DV", "03 UA", "04 Ring", "05 UTA"],
    clinicalPearls: ["Позиция 04 — только при подозрении на АБП-дефект."],
    residentTips: ["Проходите позиции в фиксированном порядке — меньше пропусков."],
    examPearls: ["Ring — conditional, остальные 4 — core extended protocol."],
    faq: [],
  },
  {
    id: "common-pitfalls",
    learningObjectives: ["Распознать типичные ошибки", "Знать последствия и профилактику"],
    keyPoints: ["Wrong vessel", "Wrong angle", "No bladder", "No context"],
    clinicalPearls: ["Один маркер никогда не определяет тактику изолированно."],
    residentTips: ["Peer review скриншотов — лучший способ ловить wrong vessel."],
    examPearls: ["Печёnoчная вена ≠ VP."],
    faq: [],
  },
  {
    id: "visual-atlas",
    learningObjectives: ["Ориентироваться по атласу SonoGyn-Pro", "Сопоставить срез и допплер"],
    keyPoints: ["9 ключевых изображений", "Placeholder до загрузки клинических эхограмм"],
    clinicalPearls: ["Сверяйте atlas с собственными сохранёнными кейсами."],
    residentTips: ["Добавляйте свои клипы в локальную папку кейса."],
    examPearls: [],
    faq: [],
  },
  {
    id: "assessment",
    learningObjectives: ["Пройти MCQ банк модуля", "Разобрать case-based вопросы"],
    keyPoints: ["quiz-bank.json", "Объяснение к каждому ответу"],
    clinicalPearls: [],
    residentTips: ["Повторяйте вопросы с ошибками через режим mistakes."],
    examPearls: [],
    faq: [],
  },
  {
    id: "case-library",
    learningObjectives: ["Разобрать 9 учебных случаев", "От beginner к advanced"],
    keyPoints: ["3+3+3 cases", "Clinical + US + Doppler"],
    clinicalPearls: [],
    residentTips: [],
    examPearls: [],
    faq: [],
  },
  {
    id: "sonogyn-educational-mode",
    learningObjectives: ["Навигация по модулю в SonoGyn-Pro"],
    keyPoints: ["/tools/refs/fetal-doppler-first-trimester"],
    clinicalPearls: [],
    residentTips: [],
    examPearls: [],
    faq: [],
  },
];

export function getEducationalCard(sectionId: FetalDopplerEducationalCard["id"]): FetalDopplerEducationalCard | undefined {
  return FETAL_DOPPLER_EDUCATIONAL_CARDS.find((c) => c.id === sectionId);
}
