import type { ExamSetPieceScenario, SetPieceReportSection } from "./types";

export const GYNECOLOGIC_REPORT_SECTIONS: SetPieceReportSection[] = [
  {
    id: "uterus",
    label: "Матка",
    prompt: "Размер, форма, положение, версия; варианты (arcuate/septate/bicornuate — 3D при сомнении)",
  },
  {
    id: "myometrium",
    label: "Миометрий",
    prompt: "Однородность, узлы (локализация, размер, тип FIGO), диффузная гипер/гипоэхогенность",
  },
  {
    id: "endometrium",
    label: "Эндометрий",
    prompt: "Толщина (макс.), контуры, полость, фаза цикла / постменопауза",
  },
  {
    id: "ovaries",
    label: "Яичники",
    prompt: "Размер, фолликулы, кисты/массы, кровоток, IOTA-дескрипторы",
  },
  {
    id: "fluid",
    label: "Жидкость",
    prompt: "Douglas / cul-de-sac — нет / мало / много; эхогенность",
  },
];

export const EXAM_SET_PIECE_SCENARIOS: ExamSetPieceScenario[] = [
  {
    id: "gyn-pmb-endometrium",
    domain: "gynecology",
    titleRu: "Set-piece · ПМК + утолщение эндометрия",
    level: "doctor",
    clinicalHistory:
      "Женщина 58 лет, менопауза 6 лет. Мажущие кровянистые выделения 2 недели. Гинекологический осмотр: шейка без видимых изменений. Направлена на УЗИ ОМТ.",
    ultrasoundFindings:
      "TA+TV: матка anteflexio, 52×48×46 мм. Миометрий однородный, узлов не выявлено. Эндометрий 14 мм, неоднородный, полиповидный участок 8×5 мм. Яичники: справа 22×14 мм (follicular remnants), слева 24×16 мм. Жидкости в Douglas нет.",
    reportSections: GYNECOLOGIC_REPORT_SECTIONS,
    differentialOptions: [
      "Полип эндометрия / гиперплазия — гистероскопия + биопсия",
      "Функциональная киста яичника — наблюдение 6–8 нед",
      "Эндометриоз — медикаментозная терапия",
      "Норма постменопаузы — контроль через год",
    ],
    correctDifferentialIndex: 0,
    sampleReport:
      "Матка: 52×48×46 мм, anteflexio, контуры ровные.\nМиометрий: однородный, узлов не выявлено.\nЭндометрий: 14 мм (постменопауза — превышает порог), неоднородный, полиповидное образование 8×5 мм.\nЯичники: без солидных масс, кист не выявлено.\nЖидкость: не определяется.\nЗаключение: утолщение эндометрия + подозрение на полип. Рекомендация: гистероскопия с биопсией / выскабливание по протоколу клиники.",
    teachingPoints: [
      "ПМК — эндометрий >4–5 мм (постменопауза) требует дообследования до исключения гиперплазии/рака.",
      "Структурированный отчёт: uterus → myometrium → endometrium → ovaries → fluid.",
      "Не путать с атрофией + артефакт; TV обязателен при доступности.",
    ],
    relatedHref: "/calculators/endometrium",
    relatedLabel: "Калькулятор эндометрия",
  },
  {
    id: "gyn-adnexal-mass",
    domain: "gynecology",
    titleRu: "Set-piece · Сложная аднексальная масса",
    level: "student",
    clinicalHistory:
      "Женщина 45 лет, регулярный цикл. Случайная находка на УЗИ брюшной полости. Жалоб нет. CA-125 не сдавала.",
    ultrasoundFindings:
      "TV: матка без особенностей, эндометрий 8 мм (proliferative). Справа яичник 38×32 мм, солидно-кистозное образование 28×24 мм с papillary projection 6 мм, vascularity score 3/4, ascites нет. Слева — без особенностей.",
    reportSections: GYNECOLOGIC_REPORT_SECTIONS,
    differentialOptions: [
      "O-RADS 4–5 — онкогинеколог + дообследование (МРТ, CA-125, консультация)",
      "Функциональная киста — контроль через 6–8 нед",
      "Параовариальная киста — наблюдение",
      "Тубо-овариальный абсcess — антибиотики",
    ],
    correctDifferentialIndex: 0,
    sampleReport:
      "Яичник справа: солидно-кистозная масса 28×24 мм, papillary projection, повышенная vascularity.\nIOTA: solid, irregular, blood flow.\nO-RADS US: 4 (высокий риск).\nРекомендация: консультация онкогинеколога, CA-125, МРТ малого таза, тактика по протоколу.",
    teachingPoints: [
      "Radiopaedia set-piece: назовите differential до заключения.",
      "Papillary projection + vascularity → O-RADS ≥4 до доказательства обратного.",
      "Ascites повышает подозрение, но отсутствие не исключает злокачественность.",
    ],
    relatedHref: "/tools/calc/rads/o-rads",
    relatedLabel: "O-RADS калькулятор",
  },
  {
    id: "ob-early-bleeding",
    domain: "obstetrics",
    titleRu: "Set-piece · Кровотечение ранней Б (6 нед)",
    level: "student",
    clinicalHistory:
      "Женщина 32 года, задержка 2 недели, тест HCG+. Мажущие выделения 3 дня, болей нет. HCG 12 000 mIU/mL (48 ч назад 8 000).",
    ultrasoundFindings:
      "TV: в полости матки gestational sac 18 мм, yolk sac +, embryo 4 mm, ЧСС 95 уд/мин. Придатки: справа corpus luteum cyst 22 mm. Douglas — trace fluid.",
    reportSections: [
      { id: "location", label: "Локализация", prompt: "Intrauterine vs ectopic — обязательно первым" },
      { id: "viability", label: "Жизненность", prompt: "GS, yolk sac, embryo, ЧСС — критерии неудачной Б" },
      { id: "dating", label: "Dating", prompt: "GS/CRL vs HCG — соответствие сроку" },
      { id: "adnexa", label: "Придатки", prompt: "CL cyst, ectopic signs, corpus luteum" },
    ],
    differentialOptions: [
      "Живая внутриматочная беременность ~6 нед — наблюдение, повтор HCG/УЗИ при кровотечении",
      "Неудачная беременность — выжидательная/медикаментозная тактика",
      "Эктопическая беременность — срочная госпитализация",
      "Molar pregnancy — HCG + histology",
    ],
    correctDifferentialIndex: 0,
    sampleReport:
      "ПЯ внутриматочно, единственное. GS 18 mm, yolk sac +, embryo 4 mm, ЧСС 95 — соответствует ~6 нед, жизненная.\nПридатки: CL справа. Эктопия не выявлена.\nРекомендация: наблюдение, повторное УЗИ 7–10 дней или раньше при усилении кровотечения.",
    teachingPoints: [
      "Discriminatory zone: при HCG >3000–5000 должна визуализироваться ПЯ.",
      "ЧСС <100 при embryo visible — тревожный признак; динамика обязательна.",
      "Trace fluid в Douglas не = эктопия.",
    ],
    relatedHref: "/tools/refs/obstetric-atlas",
    relatedLabel: "Атлас I триместра",
  },
  {
    id: "ob-fgr-third-trimester",
    domain: "obstetrics",
    titleRu: "Set-piece · Снижение шевелений + FGR (34 нед)",
    level: "doctor",
    clinicalHistory:
      "Первобеременная 34+2 нед, жалоба на уменьшение шевелений 2 дня. АД 125/80. Предыдущее УЗИ 30 нед: EFW 15th percentile.",
    ultrasoundFindings:
      "Singleton, cephalic. BPD/HC/AC/FL: EFW 1800 g (~5th percentile). AFI: deepest pocket 1.8 cm. Placenta posterior, grade II. UA Doppler: PI >95th, absent end-diastolic flow. MCA PI normal. CL 32 mm.",
    reportSections: [
      { id: "biometry", label: "Биометрия", prompt: "EFW, перцентиль, асимметрия HC/AC/FL" },
      { id: "afi", label: "AFV", prompt: "DVP / AFI — oligo criteria" },
      { id: "doppler", label: "Doppler", prompt: "UA, MCA, CPR, DV при необходимости" },
      { id: "plan", label: "План", prompt: "Стадия FGR, срок родоразрешения, стационар" },
    ],
    differentialOptions: [
      "FGR stage II–III + oligo + AEDF — urgent perinatal center, решение о сроке родоразрешения",
      "Constitutionally small fetus — outpatient follow-up",
      "Preterm labor — tocolysis",
      "Normal 34 weeks — discharge",
    ],
    correctDifferentialIndex: 0,
    sampleReport:
      "34+2 нед, cephalic. EFW 1800 g (~5th %ile), прогрессирующая задержка роста.\nAFI: oligo (DVP 1.8 cm).\nUA: AEDF. MCA: PI в норме. CPR снижен.\nЗаключение: тяжёлая FGR + oligo + критический допpler ПА.\nРекомендация: госпитализация perinatal center, КТГ, решение о экстренном родоразрешении по протоколу.",
    teachingPoints: [
      "AEDF — не амбулаторное наблюдение; ISUOG FGR guidelines.",
      "Снижение шевелений + FGR = срочная оценка.",
      "Oligo DVP <2 cm — отдельный фактор риска.",
    ],
    relatedHref: "/tools/refs/patient-information",
    relatedLabel: "Листовка FGR",
  },
];

export const SET_PIECE_COUNT = EXAM_SET_PIECE_SCENARIOS.length;

export function getSetPieceScenario(id: string): ExamSetPieceScenario | undefined {
  return EXAM_SET_PIECE_SCENARIOS.find((s) => s.id === id);
}
