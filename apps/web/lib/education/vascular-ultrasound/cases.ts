import type { VascularCase } from "./types";

export const VASCULAR_US_CASES: VascularCase[] = [
  {
    id: "carotid-moderate",
    level: "beginner",
    title: "Умеренный стеноз ВСА",
    basin: "Экстракраниальные БЦА",
    clinicalScenario: "Пациент 62 лет, шум над сонной справа, TIA 2 нед назад.",
    ultrasoundFindings: [
      "Гиперэхогенная бляшка на бифуркации справа, поверхность неровная.",
      "ИМТ ОСА 1.2 мм слева, 1.4 мм справа.",
    ],
    dopplerFindings: ["PSV ВСА справа 156 см/с", "EDV 48 см/с", "ICA/CCA ratio 2.4"],
    interpretation: "Умеренный (50–69%) гемодинамически значимый стеноз правой ВСА.",
    teachingPoints: [
      "Сочетать морфологию и допплер.",
      "При TIA — срочная консультация невролога/сосудистого хирурга.",
    ],
  },
  {
    id: "dvt-acute",
    level: "intermediate",
    title: "Острый тромбоз БПВ",
    basin: "Вены НК",
    clinicalScenario: "Женщина 45 лет, острый отёк левой голени, положительный Homans (не патognomonic).",
    ultrasoundFindings: [
      "Расширенная БПВ на бедре слева, гипо-/isoэхогенный thrombus.",
      "Неполная компрессия просвета.",
    ],
    dopplerFindings: ["Отсутствие флотации", "нет color fill в зоне тромба"],
    interpretation: "Острый тромбоз поверхностной системы — оценить вовлечение глубоких вен.",
    teachingPoints: ["Компрессия — primary criterion", "Документировать уровни проксимально/дистально"],
  },
  {
    id: "subclavian-steal",
    level: "advanced",
    title: "Синдром подключичного обкрадывания",
    basin: "Верхние конечности / VA",
    clinicalScenario: "Пожилой пациент, головокружение при движении рукой, разница АД >15 мм рт.ст.",
    ultrasoundFindings: ["Стenosis subclavian artery proximal left"],
    dopplerFindings: [
      "Retrograde flow in left VA at rest or during arm exercise",
      "Antegrade flow returns after hyperabduction test release",
    ],
    interpretation: "Subclavian steal phenomenon — гемодинамически значимое поражение.",
    teachingPoints: ["Сравнить обе VA", "Functional provocation mandatory"],
  },
];

export const casesByLevel = {
  beginner: VASCULAR_US_CASES.filter((c) => c.level === "beginner"),
  intermediate: VASCULAR_US_CASES.filter((c) => c.level === "intermediate"),
  advanced: VASCULAR_US_CASES.filter((c) => c.level === "advanced"),
};
