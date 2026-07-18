import type { ExamProtocolId } from "./types";

export type ExamPearl = {
  protocolId: ExamProtocolId;
  title: string;
  pearls: string[];
  examTips: string[];
};

export const EXAM_PEARLS: ExamPearl[] = [
  {
    protocolId: "gynecologic-pelvic",
    title: "Гинекологическое УЗИ · exam tips",
    pearls: [
      "TA → TV: сначала обзор, затем детализация. Пустой мочевой пузырь для TV.",
      "Эндометрий: измерять максимальную толщину, учитывать фазу цикла и ВМС.",
      "Сложная киста: IOTA-дескрипторы → O-RADS → допплер при подозрении.",
    ],
    examTips: [
      "Структурированный отчёт: uterus → myometrium → endometrium → ovaries → cul-de-sac.",
      "При set-piece: назовите differential до заключения.",
    ],
  },
  {
    protocolId: "obstetric-standard",
    title: "Стандартное акушерское · exam tips",
    pearls: [
      "Standard ≠ Detailed anatomy — не путайте scope исследования.",
      "EFW: указать формулу и перцентиль; сравнить с предыдущим исследованием.",
      "Placenta previa: терминология ISUOG (low-lying vs previa).",
    ],
    examTips: [
      "Всегда: число плодов, предлежание, ЧСС, плацента, AFI, шейка.",
      "Ограничения исследования — обязательная строка протокола.",
    ],
  },
  {
    protocolId: "obstetric-first-trimester",
    title: "I триместр 11–13+6 · exam tips",
    pearls: [
      "Критерии неудачной Б: СДПМ без эмбриона, КТР <7 мм без ЧСС, отсутствие ЧСС.",
      "NT: median; сравнить с MoM при расчёте риска.",
      "Nasal bone absent — soft marker; интерпретировать в контексте NT и DV.",
    ],
    examTips: [
      "Сначала viability и локализация, затем биометрия и маркеры.",
      "Назовите критерии эктопии и CSSP.",
    ],
  },
  {
    protocolId: "obstetric-third-trimester",
    title: "III триместр · exam tips",
    pearls: [
      "FGR: EFW <10th + допплер; стадирование по UA/MCA/CPR.",
      "AEDF/REDF в ПА — красный флаг; срочный план ведения.",
      "Олиго: DVP <2 cm или AFI ≤5 cm.",
    ],
    examTips: [
      "Динамика роста важнее одного измерения.",
      "Doppler — не рутина, а при FGR/компромисс плода.",
    ],
  },
];

export function getExamPearls(protocolId: ExamProtocolId): ExamPearl | undefined {
  return EXAM_PEARLS.find((p) => p.protocolId === protocolId);
}
