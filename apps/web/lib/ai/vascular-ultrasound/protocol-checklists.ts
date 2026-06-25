export type VascularBasinId =
  | "extracranial"
  | "tcd"
  | "lower-limb-arteries"
  | "lower-limb-veins"
  | "upper-limb"
  | "abdominal-aorta";

export type VascularProtocolChecklist = {
  id: VascularBasinId;
  title: string;
  kulikovChapter: string;
  indication: string;
  technique: string[];
  morphology: string[];
  hemodynamics: string[];
  functionalTests?: string[];
  reportSections: string[];
};

export const VASCULAR_PROTOCOL_CHECKLISTS: VascularProtocolChecklist[] = [
  {
    id: "extracranial",
    title: "Экстракраниальные сосуды головы и шеи",
    kulikovChapter: "Глава 4",
    indication:
      "ТИА/инсульт, шум над сонной, атеросклероз, стил-синдром, венозная дисциркуляция, контроль после КЭА/стентирования.",
    technique: [
      "АД на обеих руках до начала (асимметрия >15 мм — стил-синдром)",
      "ОСА + ВЯВ (перстневидный хрящ), ТИМ дистальный 1 см ОСА, ВСА prox/mid/dist, НСА",
      "ПА (C6–C7, исток, V2/V3), ПКА, при показаниях — БЦС (надключичный доступ)",
      "Вены: ВЯВ, ПВ; при стенозе ВСА — глазной анастомоз",
      "Стеноз: планиметрия ECST (+ NASCET ≥50%); допплер с коррекцией угла ~60°",
    ],
    morphology: [
      "ТИМ (>1 мм — патология; АСБ >1,5 мм)",
      "бляшки (эхогенность, Ca/Кр/Язв, мелкая 1,5–2 мм)",
      "деформации ВСА (С/S/петля/волнообразная)",
      "стеноз/окклюзия, диссекция, аневризма, гипоплазия ПА",
    ],
    hemodynamics: [
      "PSV/EDV ВСА, ICA/CCA ratio (табл. 4.1)",
      "направление ПА/ПКА, стил-синдром",
      "глазная артерия: PSV >15 см/с, асимметрия <30%",
      "ВЯВ >70 см/с, ПВ >30 см/с; рефлюкс, флебэктазия",
    ],
    functionalTests: [
      "Манжеточная проба (реактивная гиперемия) — стил-синдром",
      "Компрессия ветвей НСА — глазной анастомоз",
      "Вальсальва — клапан ВЯВ; гиперкапния — спазм vs гипоплазия ПА",
    ],
    reportSections: [
      "Табличный протокол §4.8 (ОСА/ВСА/ПА/вены)",
      "Заключение по §4.9 (33 стандарта)",
      "Метод стеноза (ECST/NASCET) обязателен",
      "Рекомендации (невролог/сосудистый хирург по показаниям)",
    ],
  },
  {
    id: "tcd",
    title: "Транскраниальное исследование (TCD)",
    kulikovChapter: "Глава 5",
    indication:
      "SAH/вазоспазм, инсульт (TIBI), стеноз intracranial, коллатерали, микроэмболия, ЦВРСО₂, венозная дисциркуляция.",
    technique: [
      "Окна: temporal (СМА 50–55 мм), suboccipital (ПА/ОА), orbital, submandibular",
      "PMD/TCDG — идентификация по глубине и направлению потока",
      "Вены: базальная вена Розенталя — снижение PRF",
      "При SAH — Lindegaard (Vps СМА / Vps ВСА)",
    ],
    morphology: ["стеноз", "окклюзия", "вазоспазм", "Moyamoya-паттерн"],
    hemodynamics: ["mean velocity", "Lindegard ratio (SAH)", "breath-holding / CO₂ reactivity"],
    functionalTests: ["Breath-holding test", "acetazolamide (по протоколу)"],
    reportSections: ["Описание", "Скорости/индексы", "Реактивность", "Заключение"],
  },
  {
    id: "lower-limb-arteries",
    title: "Артерии нижних конечностей",
    kulikovChapter: "Глава 6",
    indication: "Перемежающаяся хромота, критическая ишемия, контроль после реваскуляризации, диабет.",
    technique: [
      "Начинать с бедренных (Куликов); подвздошные — при показаниях",
      "ОБА → ПБА/ГБА → ПкА → ЗББА/ПББА/МБА",
      "ЛПИ 0,9–1,3; ППИ при диабете/кальцинозе",
    ],
    morphology: ["атеросклероз", "кальциноз", "тромбоз", "окклюзия", "аневризма ПкА"],
    hemodynamics: ["PSV табл. 6.1", "ИПС ≥2", "monophasic дистально"],
    reportSections: ["Протокол §6.7", "Заключение §6.8", "ЛПИ/ППИ"],
  },
  {
    id: "lower-limb-veins",
    title: "Вены нижних конечностей",
    kulikovChapter: "Глава 7",
    indication: "Отёк, боли, подозрение на ТГВ, варикоз, рецидив.",
    technique: [
      "Глубокие вены: компрессия на всех уровнях",
      "БПВ/МПВ, перфоранты, сафено-femoral junction",
      "Color + спектр при рефлюксе",
    ],
    morphology: ["тромбоз (острый/хронический)", "реканализация", "варикоз"],
    hemodynamics: ["рефлюкс: длительность, сегмент", "флотация", "компрессия полная/частичная"],
    functionalTests: ["Valsalva", "distal compression augmentation", "переход сидя/стоя"],
    reportSections: ["Проходимость", "Тромбоз/рефлюкс", "Заключение", "Рекомендации"],
  },
  {
    id: "upper-limb",
    title: "Сосуды верхних конечностей",
    kulikovChapter: "Глава 8",
    indication: "Синдром подключичного обкрадывания, тромбоз, AV-доступ.",
    technique: ["Подключичная, аксиллярная, плечевая, локтевая, лучевая; вены параллельно"],
    morphology: ["компрессия", "стеноз", "тромбоз"],
    hemodynamics: ["направление потока VA", "реакция на пробы рук"],
    functionalTests: ["Adson", "hyperabduction", "переход положений"],
    reportSections: ["Описание", "Гемодинамика", "Заключение"],
  },
  {
    id: "abdominal-aorta",
    title: "Брюшная аорта и висцеральные ветви",
    kulikovChapter: "Глава 9",
    indication: "Аневризма, диссекция, стеноз чревного ствола/ВБА/почечных артерий.",
    technique: ["Аорта: диаметр на всех уровнях", "CS, SMA, IMA, renal arteries"],
    morphology: ["аневризма", "диссекция", "тромбоз", "бляшки"],
    hemodynamics: ["PSV renal", "RAR", "end-organ ischemia signs"],
    reportSections: ["Размеры аорты", "Ветви", "Гемодинамика", "Заключение"],
  },
];

export function getVascularProtocolChecklist(id: VascularBasinId): VascularProtocolChecklist | undefined {
  return VASCULAR_PROTOCOL_CHECKLISTS.find((p) => p.id === id);
}
