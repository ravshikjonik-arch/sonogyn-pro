import type { VascularCase } from "./types";

export const VASCULAR_US_CASES: VascularCase[] = [
  {
    id: "carotid-moderate",
    level: "beginner",
    title: "Умеренный стеноз ВСА",
    basin: "Экстракраниальные БЦА · гл. 4",
    clinicalScenario: "Пациент 62 лет, шум над сонной справа, TIA 2 нед назад.",
    ultrasoundFindings: [
      "Гиперэхогенная бляшка на бифуркации справа, поверхность неровная.",
      "ТИМ ОСА 1,2 мм слева, 1,4 мм справа.",
    ],
    dopplerFindings: ["PSV ВСА справа 156 см/с", "EDV 48 см/с", "ICA/CCA ratio 2,4"],
    interpretation: "Умеренный (50–69%) гемодинамически значимый стеноз правой ВСА.",
    teachingPoints: [
      "Сочетать морфологию и допплер (табл. 4.1).",
      "При TIA — срочная консультация невролога/сосудистого хирурга.",
    ],
  },
  {
    id: "dvt-acute",
    level: "intermediate",
    title: "Острый тромбоз глубоких вен",
    basin: "Вены НК · гл. 7",
    clinicalScenario: "Женщина 45 лет, острый отёк левой голени, болезненность по ходу ОБВ.",
    ultrasoundFindings: [
      "Расширенная ОБВ/ПБВ слева, гипо-/изоэхогенный тромб.",
      "Неполная компрессия просвета на всём сегменте бедра.",
    ],
    dopplerFindings: ["Отсутствие флотации", "нет color fill в зоне тромба"],
    interpretation: "Острый тромбоз бедренно-подколенного сегмента слева.",
    teachingPoints: ["Компрессия — gold standard", "Документировать проксимальную границу"],
  },
  {
    id: "subclavian-steal",
    level: "advanced",
    title: "Синдром подключичного обкрадывания",
    basin: "Верхние конечности · гл. 8",
    clinicalScenario: "Пожилой пациент, головокружение при движении рукой, разница АД >15 мм рт.ст.",
    ultrasoundFindings: ["Стеноз/окклюзия проксимальной левой ПКА (I сегмент)"],
    dopplerFindings: [
      "Ретроградный поток в левой ПА",
      "Асимметрия PSV в дистальной ПКА >30%",
    ],
    interpretation: "Стил-синдром — гемодинамически значимое поражение I сегмента ПКА.",
    teachingPoints: ["Сравнить обе ПА", "АД на обеих руках до начала исследования"],
  },
  {
    id: "aaa-infrarenal",
    level: "intermediate",
    title: "Инфраренальная аневризма аорты",
    basin: "Аорта · гл. 9",
    clinicalScenario: "Мужчина 68 лет, скрининг AAA, пульсирующая образование в животе.",
    ultrasoundFindings: [
      "Локальное расширение инфраренального отдела аорты.",
      "Пристеночный тромб, функционирующий просвет сохранён.",
    ],
    dopplerFindings: ["Турбулентный короткий систолический сигнал в мешке", "Диаметр 44 мм (поперечно)"],
    interpretation: "Инфраренальная аневризма 44 мм — наблюдение; контроль 2×/год.",
    teachingPoints: [
      "Измерение только в поперечном сечении, перпендикулярно оси.",
      "≥50 мм — показание к операции; рост >5 мм/год — прогрессирование.",
    ],
  },
  {
    id: "renal-stenosis-rar",
    level: "advanced",
    title: "Стеноз почечной артерии",
    basin: "Почечные артерии · гл. 9",
    clinicalScenario: "Женщина 52 года, резистентная АГ, шум над брюшной аортой.",
    ultrasoundFindings: ["Ускорение потока в истоке правой ПчА"],
    dopplerFindings: ["PSV ПчА 210 см/с", "PSV аорты 55 см/с", "RAR 3,8", "Parvus-tardus в сегментарных ветвях"],
    interpretation: "Гемодинамически значимый стеноз правой почечной артерии (RAR >3,5).",
    teachingPoints: [
      "RAR при PSV аорты ≥50 см/с.",
      "Окклюзия — отсутствие сигнала + уменьшение почки <9 см.",
    ],
  },
  {
    id: "lla-stenosis",
    level: "intermediate",
    title: "Стеноз ОБА",
    basin: "Артерии НК · гл. 6",
    clinicalScenario: "Мужчина 70 лет, перемежающаяся хромота, курение.",
    ultrasoundFindings: ["Кальцинированная бляшка в проксимальной ОБА справа"],
    dopplerFindings: ["PSV в стенозе 280 см/с", "PSV проксимально 90 см/с", "ИПС ≈3,1", "Monophasic в ПБА дистально"],
    interpretation: "Выраженный стеноз ОБА справа (50–74% по табл. 6.1).",
    teachingPoints: ["ЛПИ 0,75 подтверждает гемодинамическую значимость", "Monophasic дистально — проксимальное поражение"],
  },
];

export const casesByLevel = {
  beginner: VASCULAR_US_CASES.filter((c) => c.level === "beginner"),
  intermediate: VASCULAR_US_CASES.filter((c) => c.level === "intermediate"),
  advanced: VASCULAR_US_CASES.filter((c) => c.level === "advanced"),
};
