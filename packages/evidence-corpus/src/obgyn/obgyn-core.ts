import type { EvidenceEntry } from "../types";

/** Ядро полки «Акушерство и гинекология» — гинекология + базовое акушерство. */
export const OBGYN_CORE_EVIDENCE: EvidenceEntry[] = [
  {
    id: "obgyn-endometriosis-us",
    shelf: "obgyn",
    title: "Эндометриоз · УЗИ-маркеры",
    summary:
      "Типичные sonographic признаки: эндометриома («шоколадная киста»), глубокий эндометриоз (IDEA: кишечник, параметрий, купол влагалища), adenomyosis externa; тактика — корреляция с клиникой и IDEA-картирование.",
    clinicalPearl:
      "Эндометриома: однокамерная, «ground-glass» содержимое, без papillary vascular solid areas >3 mm; при подозрении на глубокий очаг — системный осмотр по IDEA.",
    excerpt:
      "Transvaginal ultrasound is the first-line imaging modality for mapping endometriosis and endometriomas when performed by trained operators.",
    tier: 1,
    source: {
      label: "ISUOG · endometriosis / IDEA consensus",
      organization: "ISUOG · IDEA",
      year: 2023,
      url: "https://www.isuog.org/",
    },
    tags: ["эндометриоз", "эндометриома", "IDEA", "глубокий эндометриоз", "УЗИ"],
    relatedLinks: [
      { label: "IDEA · карта", href: "/idea-deep-endometriosis" },
      { label: "Помощник АГ", href: "/assistant/gynecology" },
    ],
  },
  {
    id: "obgyn-figo-myoma",
    shelf: "obgyn",
    title: "Миома матки · классификация FIGO",
    summary:
      "FIGO 2018 (0–8): тип определяет симптоматику, фертильность и тактику; submucous (0–2) — приоритет гистероскопии, intramural (3–4) и transmural (5–7) — по размеру и жалобам.",
    clinicalPearl:
      "3D TVUS или sonohysterography для submucous; в протоколе — число узлов, тип FIGO, максимальный диаметр, contact with endometrium.",
    excerpt:
      "The FIGO leiomyoma classification (types 0–8) standardizes reporting of fibroid location for surgical planning and fertility counseling.",
    tier: 1,
    source: {
      label: "FIGO leiomyoma classification 2018",
      organization: "FIGO",
      year: 2018,
    },
    tags: ["миома", "FIGO", "leiomyoma", "узлы", "матка"],
    relatedLinks: [
      { label: "Калькулятор FIGO", href: "/calculators/figo" },
      { label: "Срез матки 3D", href: "/uterus-3d" },
    ],
  },
  {
    id: "obgyn-pcos-rotterdam",
    shelf: "obgyn",
    title: "СПКЯ · критерии Rotterdam",
    summary:
      "Диагноз СПКЯ при наличии ≥2 из 3: оligo/anovulation, clinical/biochemical hyperandrogenism, polycystic ovarian morphology (≥20 фollikулов или volume ≥10 ml на одном яичнике) после исключения других причин.",
    clinicalPearl:
      "Не ставить СПКЯ только по «polycystic» яичникам у подростка; AMH — вспомогательный, не заменяет Rotterdam.",
    excerpt:
      "PCOS is diagnosed when at least two of oligo-anovulation, hyperandrogenism, and polycystic ovarian morphology are present after exclusion of other disorders.",
    tier: 1,
    source: {
      label: "ESHRE/ASRM PCOS guideline",
      organization: "ESHRE",
      year: 2023,
    },
    tags: ["СПКЯ", "PCOS", "Rotterdam", "поликистоз", "AMH", "ановуляция"],
    relatedLinks: [{ label: "Помощник АГ", href: "/assistant/gynecology" }],
  },
  {
    id: "obgyn-adenomyosis",
    shelf: "obgyn",
    title: "Аденомиоз · sonographic признаки",
    summary:
      "Признаки: asymmetrical myometrial thickening, myometrial cysts, «fan-shaped» shadowing, junctional zone disruption, vascularity; коррелирует с дysmenorrhea и AUB.",
    clinicalPearl:
      "Отличайте diffuse adenomyosis от focal «adenomyoma»; при планировании беременности документируйте JZ и наличие myometrial cysts.",
    excerpt:
      "Transvaginal ultrasound features such as myometrial cysts and junctional zone irregularity support adenomyosis diagnosis in appropriate clinical context.",
    tier: 1,
    source: {
      label: "MUSA / ISUOG adenomyosis imaging",
      organization: "ISUOG",
      year: 2022,
    },
    tags: ["аденомиоз", "adenomyosis", "JZ", "дисменорея", "матка"],
    relatedLinks: [{ label: "Срез матки 3D", href: "/uterus-3d" }],
  },
  {
    id: "obgyn-aub-palm-coein",
    shelf: "obgyn",
    title: "АМК · PALM-COEIN",
    summary:
      "Структурные (PALM): polyp, adenomyosis, leiomyoma, malignancy; неструктурные (COEIN): coagulopathy, ovulatory, endometrial, iatrogenic, not classified — задаёт маршрут обследования.",
    clinicalPearl:
      "TVUS первым шагом: эндометрий, полип, миoma FIGO, JZ; при postmenopausal bleeding — endometrial thickness и biopsy по протоколу.",
    excerpt:
      "PALM-COEIN provides a structured classification for abnormal uterine bleeding to guide diagnostic evaluation.",
    tier: 1,
    source: {
      label: "FIGO PALM-COEIN classification",
      organization: "FIGO",
      year: 2018,
    },
    tags: ["АМК", "PALM-COEIN", "маточное кровотечение", "AUB"],
    relatedLinks: [{ label: "Калькулятор эндометрия", href: "/calculators/endometrium" }],
  },
  {
    id: "obgyn-functional-cyst",
    shelf: "obgyn",
    title: "Функциональная киста яичника",
    summary:
      "Simple unilocular anechoic cyst ≤3 cm — физиология; follicular/corpus luteum до 5–7 cm часто регрессируют; контроль через 6–12 нед или раньше при боли/подозрении на осложнение.",
    clinicalPearl:
      "Classic corpus luteum: thick wall, peripheral vascularity («ring of fire»); не путать с ectopic pregnancy — β-hCG обязателен при amenorrhea.",
    excerpt:
      "Simple ovarian cysts ≤3 cm in premenopausal women are usually physiological; larger functional cysts may resolve spontaneously with interval follow-up.",
    tier: 1,
    source: {
      label: "RCOG / ACOG ovarian cyst guidance",
      organization: "RCOG",
      year: 2022,
    },
    tags: ["киста", "фолликулярная", "жёлтое тело", "яичник", "simple cyst"],
    relatedLinks: [{ label: "O-RADS Pro", href: "/calculators/o-rads" }],
  },
  {
    id: "obgyn-ovarian-torsion",
    shelf: "obgyn",
    title: "Перекрут яичника",
    summary:
      "Красные флаги: acute unilateral pain, nausea, enlarged ovary, peripheral follicles («string of pearls»), absent/reduced arterial and venous flow; это хирургическая срочность.",
    clinicalPearl:
      "Doppler не исключает torsion при сохранённом arterial flow; сравнивайте с contralateral ovary, оценивайте size и tenderness на УЗИ.",
    excerpt:
      "Ovarian torsion requires urgent surgical evaluation; Doppler findings may be variable and should not delay management when clinical suspicion is high.",
    tier: 1,
    source: {
      label: "ACOG / emergency gynecology consensus",
      organization: "ACOG",
      year: 2021,
    },
    tags: ["перекрут", "torsion", "яичник", "допплер", "острая боль"],
    relatedLinks: [{ label: "Помощник АГ", href: "/assistant/gynecology" }],
  },
  {
    id: "obgyn-pid",
    shelf: "obgyn",
    title: "ВППД / PID · диагностика",
    summary:
      "Клинический диагноз: lower abdominal pain + cervical motion tenderness ± fever; TVUS — tubo-ovarian complex, free fluid, hydrosalpinx; лечение не откладывают на «идеальное» подтверждение.",
    clinicalPearl:
      "Thickened inflamed tubes, cogwheel sign, complex adnexal mass — поддерживают PID; исключите ectopic и appendicitis по контексту.",
    excerpt:
      "Pelvic inflammatory disease is primarily a clinical diagnosis; imaging supports complications such as tubo-ovarian abscess.",
    tier: 1,
    source: {
      label: "CDC PID treatment guidelines",
      organization: "CDC",
      year: 2021,
    },
    tags: ["ВППД", "PID", "сальpingит", "тазовая инфекция"],
    relatedLinks: [{ label: "Помощник АГ", href: "/assistant/gynecology" }],
  },
  {
    id: "obgyn-endometrial-hyperplasia",
    shelf: "obgyn",
    title: "Гиперplasia эндометрия",
    summary:
      "При AUB и факторах риска (ожирение, аnovulation, tamoxifen) — оценка endometrial thickness и biopsy; atypical hyperplasia — онкопроктология, не «наблюдение».",
    clinicalPearl:
      "Premenopausal: нет единого cut-off толщины; postmenopausal bleeding + ET >4–5 mm (без HRT) — показание к endometrial sampling.",
    excerpt:
      "Endometrial sampling is indicated for abnormal uterine bleeding with risk factors or postmenopausal endometrial thickening above protocol thresholds.",
    tier: 1,
    source: {
      label: "ESHRE/ESGO endometrial hyperplasia guideline",
      organization: "ESHRE",
      year: 2022,
    },
    tags: ["гиперplasia", "эндометрий", "AUB", "atypia", "биопсия"],
    relatedLinks: [{ label: "Калькулятор эндометрия", href: "/calculators/endometrium" }],
  },
  {
    id: "obgyn-ectopic-pregnancy",
    shelf: "obgyn",
    title: "Эктопическая беременность",
    summary:
      "Discriminatory zone: при IUP β-hCG выше порога должна visualizироваться intrauterine gestational sac; adnexal mass, empty uterus, free fluid — ectopic до доказательства обратного.",
    clinicalPearl:
      "TVUS + serial β-hCG; live ectopic — urgent referral; heterotopic редок, но возможен при ART.",
    excerpt:
      "Transvaginal ultrasound combined with serial β-hCG is central to locating early pregnancy and excluding ectopic gestation.",
    tier: 1,
    source: {
      label: "ACOG / NICE ectopic pregnancy guidance",
      organization: "ACOG",
      year: 2023,
    },
    tags: ["эктопическая", "ectopic", "β-hCG", "ранняя беременность"],
    relatedLinks: [{ label: "Помощник акушера", href: "/assistant/obstetrics" }],
  },
  {
    id: "obgyn-early-pregnancy-loss",
    shelf: "obgyn",
    title: "Ранний невынашивание · тактика",
    summary:
      "Non-viable pregnancy: MSD ≥25 mm без embryo или CRL ≥7 mm без cardiac activity; uncertain — повтор через 7–14 дней; management: expectant, medical (misoprostol), surgical по выбору и протоколу.",
    clinicalPearl:
      "Не диагностируйте non-viability при одном «пограничном» измерении; документируйте CRL, cardiac activity, MSD, yolk sac.",
    excerpt:
      "Strict ultrasound criteria reduce false diagnosis of miscarriage; repeat scan is recommended when findings are inconclusive.",
    tier: 1,
    source: {
      label: "ISUOG early pregnancy loss guideline",
      organization: "ISUOG",
      year: 2023,
    },
    tags: ["невынашивание", "miscarriage", "MSD", "CRL", "ранняя беременность"],
    relatedLinks: [{ label: "Помощник акушера", href: "/assistant/obstetrics" }],
  },
  {
    id: "obgyn-hyperemesis",
    shelf: "obgyn",
    title: "Гиперemesis gravidarum",
    summary:
      "Persistent vomiting с ketosis, weight loss, electrolyte disturbance; исключить molar pregnancy, hyperthyroidism, GI causes; лечение: antiemetics, thiamine, при refractory — IV fluids / hospitalization.",
    clinicalPearl:
      "При HG — TVUS для подтверждения living IUP и исключения molar; щитовидная функция по показаниям.",
    excerpt:
      "Hyperemesis gravidarum requires exclusion of other causes and treatment to prevent dehydration and thiamine deficiency.",
    tier: 1,
    source: {
      label: "RCOG hyperemesis guideline",
      organization: "RCOG",
      year: 2023,
    },
    tags: ["гиперemesis", "HG", "рвота", "беременность", "кетоны"],
    relatedLinks: [{ label: "Помощник акушера", href: "/assistant/obstetrics" }],
  },
  {
    id: "obgyn-preeclampsia-mgmt",
    shelf: "obgyn",
    title: "Преэклампсия · клиническое ведение",
    summary:
      "После 20 нед: hypertension + proteinuria или end-organ dysfunction; delivery — единственное окончательное лечение; timing балансирует maternal risk и gestational age; magnesium sulfate для eclampsia prophylaxis.",
    clinicalPearl:
      "Red flags: severe hypertension, symptoms (headache, visual, epigastric pain), abnormal liver/ platelets — urgent maternal-fetal assessment.",
    excerpt:
      "Pre-eclampsia management focuses on blood pressure control, fetal surveillance, and timely delivery based on severity and gestational age.",
    tier: 1,
    source: {
      label: "ISSHP / FIGO preeclampsia recommendations",
      organization: "ISSHP · FIGO",
      year: 2022,
    },
    tags: ["преэклампсия", "preeclampsia", "гипертензия", "белок", "магний"],
    relatedLinks: [
      { label: "FMF · PE калькулятор", href: "/assistant/fmf" },
      { label: "Помощник акушера", href: "/assistant/obstetrics" },
    ],
  },
  {
    id: "obgyn-hellp",
    shelf: "obgyn",
    title: "HELLP-синдром",
    summary:
      "Hemolysis, elevated liver enzymes, low platelets — severe form of hypertensive disorder; высокий риск placental abruption, DIC, maternal morbidity; delivery обычно неотложна при ≥34 нед или при maternal decompensation.",
    clinicalPearl:
      "Не откладывайте при suspicion HELLP из-за «стабильного» BPP; лаборатории + BP + symptoms важнее одного УЗИ-параметра.",
    excerpt:
      "HELLP syndrome is a medical emergency associated with significant maternal morbidity requiring urgent multidisciplinary management.",
    tier: 1,
    source: {
      label: "ACOG hypertensive disorders in pregnancy",
      organization: "ACOG",
      year: 2020,
    },
    tags: ["HELLP", "тромboциты", "печень", "гемолиз", "преэклампсия"],
    relatedLinks: [{ label: "Помощник акушера", href: "/assistant/obstetrics" }],
  },
  {
    id: "obgyn-gdm-screening",
    shelf: "obgyn",
    title: "ГСД · скрининг и диагностика",
    summary:
      "Universal screening 24–28 нед (или раньше при факторах риска): OGTT 75 g — fasting ≥5.1, 1h ≥10.0, 2h ≥8.5 mmol/L (IADPSG); one abnormal value = GDM.",
    clinicalPearl:
      "При macrosomia/polyhydramnios на УЗИ — проверьте, выполнен ли OGTT; fetal growth profile + maternal glucose control.",
    excerpt:
      "The IADPSG one-step 75-g OGTT criteria are widely used for gestational diabetes diagnosis after 24–28 weeks.",
    tier: 1,
    source: {
      label: "IADPSG / WHO GDM criteria",
      organization: "IADPSG · WHO",
      year: 2022,
    },
    tags: ["ГСД", "GDM", "OGTT", "глюкоза", "скрининг"],
    relatedLinks: [{ label: "FMF · GDM risk", href: "/assistant/fmf" }],
  },
];
