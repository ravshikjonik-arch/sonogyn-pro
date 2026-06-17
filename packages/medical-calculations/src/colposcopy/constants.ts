import type {
  ColposcopyComplaintKey,
  ColposcopyFindingKey,
  CervixShapeKey,
  SwedeCriterionKey,
  SwedeScoreLevel,
} from "./types";

export const SWEDE_SOURCE = "Swede Score · IFCPC 2011 · оценка риска CIN 2+ при кольпоскопии";

export const SWEDE_CRITERIA: {
  key: SwedeCriterionKey;
  title: string;
  options: { value: SwedeScoreLevel; label: string; short: string }[];
}[] = [
  {
    key: "acetowhite",
    title: "Уксусная реакция",
    options: [
      { value: 0, label: "Прозрачная", short: "0" },
      { value: 1, label: "Молочная / туманная", short: "1" },
      { value: 2, label: "Плотный белый эпителий", short: "2" },
    ],
  },
  {
    key: "margins",
    title: "Границы очага",
    options: [
      { value: 0, label: "Размытые", short: "0" },
      { value: 1, label: "Неровные («географические»)", short: "1" },
      { value: 2, label: "Ровные с возвышением («манжета»)", short: "2" },
    ],
  },
  {
    key: "vessels",
    title: "Сосуды",
    options: [
      { value: 0, label: "Тонкие, ровные", short: "0" },
      { value: 1, label: "Отсутствуют", short: "1" },
      { value: 2, label: "Грубые / атипичные", short: "2" },
    ],
  },
  {
    key: "lesionSize",
    title: "Размер очага",
    options: [
      { value: 0, label: "< 5 мм", short: "0" },
      { value: 1, label: "5–15 мм", short: "1" },
      { value: 2, label: "> 15 мм", short: "2" },
    ],
  },
  {
    key: "iodine",
    title: "Йод-негативная зона",
    options: [
      { value: 0, label: "Окрашивание есть", short: "0" },
      { value: 1, label: "Частичное", short: "1" },
      { value: 2, label: "Полное отсутствие", short: "2" },
    ],
  },
];

export const COMPLAINT_LABELS: Record<ColposcopyComplaintKey, string> = {
  cycle_disorder: "Нарушения цикла",
  pain: "Боли",
  discharge: "Выделения",
  infertility: "Бесплодие",
  vulvodynia: "Вульводиния",
  other: "Другое",
};

export const CERVIX_SHAPE_LABELS: Record<CervixShapeKey, string> = {
  cylindrical: "Цилиндрическая",
  conical: "Коническая",
  flat: "Уплощённая",
  hypertrophied: "Гипертрофированная",
};

export const FINDING_LABELS: Record<ColposcopyFindingKey, string> = {
  tz_incomplete: "ЗТ неполная",
  tz_high_grade: "ЗТ высокого грейда",
  open_glands: "Открытые железы (ОЖ)",
  retention_cyst: "Ретенционные кисты (РК)",
  atypical_vessels: "Атипичные сосуды (АС)",
  mosaicism: "Мозаика (М)",
  punctuation: "Пунктуация (П)",
  keratosis: "Кератоз / лейкоплакия (К/Л)",
  ectopy: "Эктопия (Эк)",
  endometriosis: "Эндометриоз (Эм)",
};

export const ANAMNESIS_LABELS: Record<import("./types").ColposcopyAnamnesisKey, string> = {
  sti_chlamydia: "Хламидиоз",
  sti_hpv: "ВПЧ",
  sti_hsv: "ВПГ",
  sti_gonorrhea: "Гонорея",
  sti_syphilis: "Сифилис",
  path_dysplasia: "Дисплазия в анамнезе",
  path_leukoplakia: "Лейкоплакия",
  path_erosion: "Эрозия",
  screen_hpv: "Тест HPV",
  screen_cytology: "Цитология (Пап)",
  screen_biopsy: "Биопсия ранее",
  contraception_coc: "КОК",
  contraception_iud: "ВМС",
  contraception_condom: "Барьерная контрацепция",
  treatment_laser: "Лазер",
  treatment_cryo: "Криотерапия",
  treatment_leep: "LEEP / конизация",
};

export const ANAMNESIS_GROUPS: { title: string; keys: import("./types").ColposcopyAnamnesisKey[] }[] = [
  {
    title: "ИППП",
    keys: ["sti_chlamydia", "sti_hpv", "sti_hsv", "sti_gonorrhea", "sti_syphilis"],
  },
  {
    title: "Патология шейки",
    keys: ["path_dysplasia", "path_leukoplakia", "path_erosion"],
  },
  {
    title: "Скрининг",
    keys: ["screen_hpv", "screen_cytology", "screen_biopsy"],
  },
  {
    title: "Контрацепция",
    keys: ["contraception_coc", "contraception_iud", "contraception_condom"],
  },
  {
    title: "Лечение ранее",
    keys: ["treatment_laser", "treatment_cryo", "treatment_leep"],
  },
];

export const DEFAULT_SWEDE_INPUT = (): import("./types").SwedeScoreInput => ({
  acetowhite: 0,
  margins: 0,
  vessels: 0,
  lesionSize: 0,
  iodine: 0,
});

export const DEFAULT_PROTOCOL_INPUT = (): import("./types").ColposcopyProtocolInput => ({
  patientName: "",
  patientAge: "",
  patientId: "",
  complaints: [],
  complaintsOther: "",
  anamnesis: [],
  anamnesisNotes: "",
  ageFirstSex: "",
  births: "",
  abortions: "",
  lmp: "",
  smokes: false,
  cigarettesPerDay: "",
  cervixShape: "",
  findings: [],
  acetowhiteEpithelium: "none",
  marginQuality: "sharp",
  iodineZone: "positive",
  colposcopicDiagnosis: "",
  clinicalDiagnosis: "",
  recommendations: "",
  physicianName: "",
  institution: "",
});

export const DEFAULT_COLOPOSCOPY_TEMPLATES: import("./types").ColposcopyTemplate[] = [
  {
    id: "norm",
    name: "Низкий риск · наблюдение",
    text: `Пациентка {name}, {age} лет.
При кольпоскопии: ацетобелый эпителий без признаков высокого грейда. Swede Score: {score} баллов — {risk}.
Рекомендовано: {recommendation}.
Кольпоскопическое заключение: {colposcopic_diagnosis}.`,
  },
  {
    id: "biopsy",
    name: "Умеренный риск · биопсия",
    text: `Пациентка {name}, {age} лет.
При кольпоскопии выявлены изменения, требующие верификации. Swede Score: {score} баллов — {risk}.
Рекомендовано: {recommendation}.
Выполнена прицельная биопсия под контролем кольпоскопии.
Кольпоскопическое заключение: {colposcopic_diagnosis}.`,
  },
  {
    id: "cin2",
    name: "Высокий риск CIN 2+",
    text: `Пациентка {name}, {age} лет.
При кольпоскопии — признаки высокого грейда. Swede Score: {score} баллов — {risk}.
Рекомендовано: {recommendation}.
Обязательна биопсия с гистологическим исследованием; тактика по результату гистологии.
Кольпоскопическое заключение: {colposcopic_diagnosis}.`,
  },
  {
    id: "yakubov",
    name: "Протокол кольпоскопии (стандартный бланк)",
    text: `ПРОТОКОЛ КОЛЬПОСКОПИИ

Пациентка: {name}, {age} лет. ID: {patient_id}.
Дата: {date}.

Жалобы: {complaints}.
Анамнез: {anamnesis}.

Кольпоскопическая картина: {findings}.
Форма шейки: {cervix_shape}.
Ацетобелый эпителий: {acetowhite_detail}.
Границы: {margins_detail}. Йод-негативная зона: {iodine_detail}.

Swede Score: {score} баллов — {risk}.
Рекомендация: {recommendation}.

Кольпоскопический диагноз: {colposcopic_diagnosis}.
Клинический диагноз: {clinical_diagnosis}.

Заключение врача: {recommendations}

Врач: {physician}. {institution}`,
  },
];
