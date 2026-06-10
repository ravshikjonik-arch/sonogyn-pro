import type { EvidenceEntry } from "../types";

/** Ядро полки «Шейка матки · риски» — скрининг, ВПЧ, CIN, кольпоскопия. */
export const CERVIX_CORE_EVIDENCE: EvidenceEntry[] = [
  {
    id: "cervix-screening-algorithm",
    shelf: "cervix",
    title: "Скрининг рака шейки · алгоритм",
    summary:
      "Первичный скрининг: цитология (Pap) и/или ВПЧ-тест по возрасту и протоколу; при положительном ВПЧ — типирование 16/18 и/или кольпоскопия; интервалы повторного скрининга зависят от результата.",
    clinicalPearl:
      "УЗИ шейки не заменяет цитологию/ВПЧ; в протоколе ТВ-УЗИ — длина CL при беременности, полип/кисты Набота, но скрининг — отдельный маршрут.",
    excerpt:
      "Cervical cancer screening should follow age-based cytology and/or HPV testing with triage of abnormal results.",
    tier: 1,
    source: {
      label: "WHO cervical cancer screening guideline",
      organization: "WHO",
      year: 2021,
    },
    tags: ["скрининг", "цитология", "Pap", "рак шейки", "ВПЧ"],
    relatedLinks: [{ label: "Нозология · шейка", href: "/nosologies/cervix-pathology" }],
  },
  {
    id: "cervix-hpv-primary",
    shelf: "cervix",
    title: "ВПЧ · первичный скрининг",
    summary:
      "HPV primary screening (обычно с 30–35 лет) повышает чувствительность vs цитология в одиночку; HPV-negative — длинный интервал повторного обследования по протоколу.",
    clinicalPearl:
      "Transient HPV common in young women — не паниковать при первом positive у <30 без дисплазии; следовать age-specific triage.",
    excerpt:
      "Primary HPV testing is recommended as a standalone screening strategy in defined age groups with cytology triage of positive results.",
    tier: 1,
    source: {
      label: "ASCCP / EUROGIN HPV-based screening",
      organization: "ASCCP",
      year: 2022,
    },
    tags: ["ВПЧ", "HPV", "primary screening", "скрининг"],
    relatedLinks: [{ label: "Помощник АГ", href: "/assistant/gynecology" }],
  },
  {
    id: "cervix-hpv-genotyping",
    shelf: "cervix",
    title: "ВПЧ 16/18 · типирование",
    summary:
      "Genotypes 16 и 18 — highest risk for CIN3+; при positive co-test или HPV+ с normal cytology — genotyping или immediate colposcopy по протоколу.",
    clinicalPearl:
      "HPV 16+ с normal Pap — не «наблюдение без кольпоскопии» в большинстве современных алгоритмов; документируйте genotype в направлении.",
    excerpt:
      "HPV genotypes 16 and 18 confer the highest risk of high-grade cervical intraepithelial neoplasia and invasive cancer.",
    tier: 1,
    source: {
      label: "ASCCP risk-based management consensus",
      organization: "ASCCP",
      year: 2021,
    },
    tags: ["ВПЧ 16", "ВПЧ 18", "genotyping", "CIN3", "triage"],
  },
  {
    id: "cervix-asc-us",
    shelf: "cervix",
    title: "ASC-US · тактика",
    summary:
      "Atypical squamous cells of undetermined significance: reflex HPV testing или repeat cytology через 12 мес; HPV-positive ASC-US → colposcopy.",
    clinicalPearl:
      "ASC-US не равно «повтор через 3 года»; у postmenopausal women — lower threshold для colposcopy при persistent abnormality.",
    excerpt:
      "Management of ASC-US relies on reflex HPV testing or repeat cytology with colposcopy for HPV-positive results.",
    tier: 1,
    source: {
      label: "ASCCP 2019/2020 guidelines",
      organization: "ASCCP",
      year: 2020,
    },
    tags: ["ASC-US", "цитология", "triage", "кольпоскопия"],
  },
  {
    id: "cervix-lsil",
    shelf: "cervix",
    title: "LSIL · ведение",
    summary:
      "Low-grade SIL часто ассоциирован с transient HPV; у ≥25 лет — colposcopy; у молодых — repeat cytology/HPV через 12 мес или colposcopy по симптомам/ persistence.",
    clinicalPearl:
      "Не назначайте destructive treatment при isolated LSIL без colposcopy/biopsy confirmation of CIN2+.",
    excerpt:
      "LSIL management depends on age and HPV status, with colposcopy recommended for non-adolescent patients in most guidelines.",
    tier: 1,
    source: {
      label: "ASCCP LSIL management",
      organization: "ASCCP",
      year: 2020,
    },
    tags: ["LSIL", "низкая дисплазия", "CIN1", "цитология"],
  },
  {
    id: "cervix-hsil-cin2",
    shelf: "cervix",
    title: "HSIL / CIN2–3 · лечение",
    summary:
      "High-grade lesions требуют colposcopy с biopsy; CIN2+ — excisional treatment (LEEP/LLETZ, conization) или ablation при строгих criteria; наблюдение только в selected CIN2 young patients.",
    clinicalPearl:
      "Endocervical sampling при type 2/3 transformation zone; margin status влияет на follow-up после excision.",
    excerpt:
      "CIN2 and CIN3 are treated with excisional procedures unless observation is chosen in carefully selected young patients.",
    tier: 1,
    source: {
      label: "ASCCP / FIGO CIN management",
      organization: "ASCCP · FIGO",
      year: 2021,
    },
    tags: ["HSIL", "CIN2", "CIN3", "конизация", "LEEP", "LLETZ"],
    relatedLinks: [{ label: "Нозология · шейка", href: "/nosologies/cervix-pathology" }],
  },
  {
    id: "cervix-cin1-management",
    shelf: "cervix",
    title: "CIN1 · наблюдение vs лечение",
    summary:
      "CIN1 часто регрессирует; preferred — surveillance с repeat cytology/HPV и colposcopy по протоколу; treatment при persistence ≥2 лет или неполная видимость зоны трансформации.",
    clinicalPearl:
      "Различайте histologic CIN1 и cytologic LSIL; pregnancy — defer treatment unless invasive disease suspected.",
    excerpt:
      "CIN1 is usually managed with surveillance rather than immediate excision unless persistence or progression occurs.",
    tier: 1,
    source: {
      label: "ASCCP CIN1 consensus",
      organization: "ASCCP",
      year: 2020,
    },
    tags: ["CIN1", "наблюдение", "реgression", "дисплазия"],
  },
  {
    id: "cervix-colposcopy-indications",
    shelf: "cervix",
    title: "Кольпоскопия · показания",
    summary:
      "Colposcopy indicated при abnormal screening (HPV+, HSIL, persistent ASC-US/LSIL), visible lesion on cervix, post-treatment surveillance; pregnancy — modified approach без endocervical curettage.",
    clinicalPearl:
      "Document TZ type, acetowhite, punctuation, mosaic, atypical vessels; biopsy worst-looking area ≥ grade suggested.",
    excerpt:
      "Colposcopy with directed biopsy is the standard evaluation for abnormal cervical screening tests and suspected precancer.",
    tier: 1,
    source: {
      label: "ISSVD / ASCCP colposcopy standards",
      organization: "ISSVD",
      year: 2021,
    },
    tags: ["кольпоскопия", "colposcopy", "biopsy", "TZ", "показания"],
  },
  {
    id: "cervix-see-and-treat",
    shelf: "cervix",
    title: "See-and-treat · LEEP",
    summary:
      "See-and-treat LEEP допустим при high-grade cytology (HSIL+) и satisfactory colposcopy с visible lesion extending into TZ; reduces visits but risks overtreatment.",
    clinicalPearl:
      "Не применяйте see-and-treat при unsatisfactory colposcopy, AGUS, или suspected glandular lesion без ECC.",
    excerpt:
      "See-and-treat excision may be offered for HSIL when colposcopy is satisfactory and the lesion is fully visible.",
    tier: 1,
    source: {
      label: "ASCCP see-and-treat guidance",
      organization: "ASCCP",
      year: 2020,
    },
    tags: ["see-and-treat", "LEEP", "HSIL", "excision"],
  },
  {
    id: "cervix-post-treatment-surveillance",
    shelf: "cervix",
    title: "Наблюдение после лечения CIN",
    summary:
      "After CIN2+ treatment: co-testing (HPV + cytology) через 12 и 24 мес, затем annual до 5 лет; positive HPV или abnormal cytology → colposcopy + ECC.",
    clinicalPearl:
      "Recurrence risk highest first 2 years; inform patient о need for long-term follow-up даже после successful excision.",
    excerpt:
      "Post-treatment surveillance uses HPV-based testing at defined intervals to detect recurrence of high-grade disease.",
    tier: 1,
    source: {
      label: "ASCCP post-treatment follow-up",
      organization: "ASCCP",
      year: 2020,
    },
    tags: ["follow-up", "recurrence", "HPV test", "после LEEP", "CIN"],
  },
  {
    id: "cervix-agc-glandular",
    shelf: "cervix",
    title: "AGC · железистые аномалии",
    summary:
      "Atypical glandular cells (AGC) — higher risk AIS/cancer; colposcopy + endocervical sampling обязательны; endometrial assessment при AGC-NOS или ≥35 лет.",
    clinicalPearl:
      "Не трактуйте AGC как «лёгкая дисплазия»; TVUS эндометрия + biopsy по протоколу при postmenopausal или AGC favor neoplasia.",
    excerpt:
      "AGC on cytology requires colposcopy, endocervical sampling, and often endometrial evaluation.",
    tier: 1,
    source: {
      label: "ASCCP glandular cell management",
      organization: "ASCCP",
      year: 2020,
    },
    tags: ["AGC", "AGUS", "AIS", "железистая", "endometrial"],
    relatedLinks: [{ label: "Калькулятор эндометрия", href: "/calculators/endometrium" }],
  },
  {
    id: "cervix-hpv-vaccination",
    shelf: "cervix",
    title: "Вакцинация ВПЧ",
    summary:
      "HPV vaccination (bivalent/quadrivalent/9-valent) — primary prevention; recommended для adolescents; catch-up до 26 лет (и selected older по локальным КР); не заменяет screening.",
    clinicalPearl:
      "Vaccinated women продолжают routine cervical screening — vaccine covers не все oncogenic types.",
    excerpt:
      "HPV vaccination prevents infection with high-risk types but does not eliminate the need for cervical screening.",
    tier: 1,
    source: {
      label: "WHO / CDC HPV vaccination position",
      organization: "WHO · CDC",
      year: 2022,
    },
    tags: ["вакцина", "Gardasil", "Cervarix", "профилактика", "ВПЧ"],
  },
  {
    id: "cervix-kr-rf-screening",
    shelf: "cervix",
    title: "КР РФ · скрининг шейки",
    summary:
      "В РФ скрининг рака шейки — цитология каждые 3 года (или чаще по протоколу ДЗМ/региона); при аномалии — кольпоскопия и биопсия; ВПЧ-тест внедряется в региональных программах.",
    clinicalPearl:
      "Сверяйте возрастные интервалы с локальным приказом; при dual practice — документируйте, какой алгоритм применён.",
    excerpt:
      "Russian clinical recommendations define population cervical cytology screening intervals with colposcopic triage of abnormalities.",
    tier: 1,
    source: {
      label: "КР МЗ РФ · профилактика рака шейки матки",
      organization: "МЗ РФ",
      year: 2021,
    },
    tags: ["КР РФ", "скрининг", "цитология", "Россия", "ДЗМ"],
    relatedLinks: [{ label: "КР и приказы", href: "/guidelines" }],
  },
  {
    id: "cervix-cl-measurement",
    shelf: "cervix",
    title: "CL · техника измерения",
    summary:
      "Transvaginal CL: empty bladder, probe parallel to cervical canal, measure linear length from internal to external os without excessive pressure; 3 measurements — shortest valid.",
    clinicalPearl:
      "Pressure artifact укорачивает CL; при funneling измеряйте только closed length; документируйте GA при измерении.",
    excerpt:
      "Standardized transvaginal measurement of cervical length requires minimal probe pressure and reporting of the shortest valid length.",
    tier: 1,
    source: {
      label: "ISUOG cervical length practice",
      organization: "ISUOG",
      year: 2022,
    },
    tags: ["CL", "cervical length", "измерение", "ТВ-УЗИ", "техника"],
    relatedLinks: [{ label: "Калькулятор CL", href: "/calculators/cervical-length" }],
  },
  {
    id: "cervix-cl-thresholds",
    shelf: "cervix",
    title: "Короткая шейка · пороги CL",
    summary:
      "CL <25 mm до 24 нед — high risk spontaneous PTB; <15 mm — very high risk; тактика: progesterone, cerclage (history-based или ultrasound-indicated), serial CL.",
    clinicalPearl:
      "Single short CL без symptoms — не preterm labor; отличайте от cervical change при contractions.",
    excerpt:
      "A cervical length below 25 mm before 24 weeks identifies women at increased risk of spontaneous preterm birth.",
    tier: 1,
    source: {
      label: "ISUOG / SMFM short cervix",
      organization: "ISUOG · SMFM",
      year: 2022,
    },
    tags: ["CL", "25 мм", "короткая шейка", "преждevременные", "порог"],
    relatedLinks: [
      { label: "Калькулятор CL", href: "/calculators/cervical-length" },
      { label: "FMF · преterm", href: "/assistant/fmf" },
    ],
  },
];
