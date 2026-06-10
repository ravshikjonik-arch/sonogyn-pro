import type { EvidenceEntry } from "../types";

/** Дополнения полки cervix — акушерская шейка, патология, беременность. */
export const CERVIX_ADDITIONAL_EVIDENCE: EvidenceEntry[] = [
  {
    id: "cervix-funneling",
    shelf: "cervix",
    title: "Funneling · U-формирование",
    summary:
      "Cervical funneling (internal os dilatation with preserved CL segment) adds risk beyond CL alone; document width of funnel and remaining closed length.",
    clinicalPearl:
      "V-shaped vs U-shaped funneling — U-shape historically higher risk; измеряйте только closed cervical length для протокола FMF/ISUOG.",
    excerpt:
      "Cervical funneling complements cervical length in assessing preterm birth risk.",
    tier: 1,
    source: {
      label: "FMF / ISUOG cervical imaging",
      organization: "FMF · ISUOG",
      year: 2023,
    },
    tags: ["funneling", "U-shape", "CL", "internal os", "преждevременные"],
    relatedLinks: [{ label: "Калькулятор CL", href: "/calculators/cervical-length" }],
  },
  {
    id: "cervix-progesterone-short",
    shelf: "cervix",
    title: "Progesterone · короткая шейка",
    summary:
      "Vaginal micronized progesterone снижает PTB при singleton с short CL без history of PTB; начало обычно после выявления CL <25 mm до 24 нед.",
    clinicalPearl:
      "Twin pregnancy — другой алгоритм (progesterone не показан routinely); не путать с 17-OHPC intramuscular для history of PTB.",
    excerpt:
      "Vaginal progesterone reduces preterm birth in singleton pregnancies with a short cervix identified on ultrasound.",
    tier: 1,
    source: {
      label: "SMFM / ISUOG progesterone recommendations",
      organization: "SMFM",
      year: 2022,
    },
    tags: ["progesterone", "прогesterone", "короткая шейка", "CL", "профилактика ПР"],
    relatedLinks: [{ label: "Калькулятор CL", href: "/calculators/cervical-length" }],
  },
  {
    id: "cervix-cerclage-types",
    shelf: "cervix",
    title: "Cerclage · показания",
    summary:
      "History-indicated cerclage при classic cervical insufficiency; ultrasound-indicated при short CL; emergency cerclage — selected cases with exposed membranes excluded.",
    clinicalPearl:
      "McDonald vs Shirodkar — по хирургической школе; перед cerclage — exclude intraamniotic infection/labor.",
    excerpt:
      "Cervical cerclage is indicated for history of cervical insufficiency or ultrasound-detected short cervix in selected protocols.",
    tier: 1,
    source: {
      label: "RCOG / ISUOG cerclage guideline",
      organization: "RCOG",
      year: 2022,
    },
    tags: ["cerclage", "швы", "цervical insufficiency", "история ПР"],
    relatedLinks: [{ label: "Калькулятор CL", href: "/calculators/cervical-length" }],
  },
  {
    id: "cervix-polyp",
    shelf: "cervix",
    title: "Полип шейки матки",
    summary:
      "Cervical polyp — soft echogenic intracanalicular lesion; usually benign; removal for bleeding, infertility workup, or atypical appearance; histology mandatory.",
    clinicalPearl:
      "На ТВ-УЗИ полип vs proliferative endocervical fold — dynamic scan; при pregnancy — defer polypectomy unless symptomatic bleeding.",
    excerpt:
      "Cervical polyps are commonly benign but should be removed and sent for histology when clinically indicated.",
    tier: 2,
    source: {
      label: "RCOG benign cervical lesions",
      organization: "RCOG",
      year: 2021,
    },
    tags: ["полип", "polyp", "шейка", "канал", "кровотечение"],
    relatedLinks: [{ label: "Нозология · шейка", href: "/nosologies/cervix-pathology" }],
  },
  {
    id: "cervix-nabothian-cysts",
    shelf: "cervix",
    title: "Кисты Набота",
    summary:
      "Nabothian cysts — retention cysts in cervix, anechoic, benign; no treatment; не путать с cystic neoplasm или deep endometriosis of cervix (rare).",
    clinicalPearl:
      "Multiple small anechoic inclusions в stroma — типично; при atypical septations/solid — colposcopy, не «наблюдение».",
    excerpt:
      "Nabothian cysts are benign cervical inclusion cysts requiring no intervention unless mimicking another pathology.",
    tier: 2,
    source: {
      label: "ISUOG gynecologic ultrasound lexicon",
      organization: "ISUOG",
      year: 2022,
    },
    tags: ["Набота", "Nabothian", "киста", "шейка", "benign"],
  },
  {
    id: "cervix-ectropion",
    shelf: "cervix",
    title: "Эктопия · ectropion",
    summary:
      "Ectropion (eversion columnar epithelium) — физиologic variant или postpartum/OCP; не CIN; при bleeding/contact — colposcopy если abnormal screening.",
    clinicalPearl:
      "Red glandular tissue around os на осмотре — не автоматически «эрозия для cauterization»; нужен актуальный Pap/HPV.",
    excerpt:
      "Cervical ectropion is a benign finding and does not require treatment unless associated with abnormal screening.",
    tier: 2,
    source: {
      label: "RCOG benign cervical conditions",
      organization: "RCOG",
      year: 2021,
    },
    tags: ["эктопия", "ectropion", "эрозия", "шейка"],
    relatedLinks: [{ label: "Нозология · шейка", href: "/nosologies/cervix-pathology" }],
  },
  {
    id: "cervix-pregnancy-colposcopy",
    shelf: "cervix",
    title: "Кольпоскопия при беременности",
    summary:
      "Colposcopy safe in pregnancy for indicated lesions; biopsy only if invasion suspected; avoid ECC; treatment of CIN deferred to postpartum unless cancer suspected.",
    clinicalPearl:
      "Decidual changes mimic neoplasia — experienced colposcopist; do not excise CIN2 in pregnancy without strong indication.",
    excerpt:
      "Colposcopy during pregnancy is performed for indicated cytologic abnormalities with biopsy reserved for suspected invasion.",
    tier: 1,
    source: {
      label: "ASCCP pregnancy management",
      organization: "ASCCP",
      year: 2020,
    },
    tags: ["беременность", "кольпоскопия", "CIN", "biopsy", "decidual"],
  },
  {
    id: "cervix-post-lletz-pregnancy",
    shelf: "cervix",
    title: "Беременность после LLETZ/конизации",
    summary:
      "Prior excision — slight ↑ risk PTB и preterm ROM; measure CL in II trimester; history + CL guide progesterone/cerclage; mode of delivery usually vaginal.",
    clinicalPearl:
      "Document depth of prior excision if known; short CL после LLETZ — усиленный мониторинг, не automatic cesarean.",
    excerpt:
      "Women with prior cervical excision may benefit from second-trimester cervical length surveillance in pregnancy.",
    tier: 1,
    source: {
      label: "RCOG / ISUOG post-excision pregnancy",
      organization: "RCOG",
      year: 2022,
    },
    tags: ["LLETZ", "конизация", "беременность", "CL", "исход"],
    relatedLinks: [{ label: "Калькулятор CL", href: "/calculators/cervical-length" }],
  },
  {
    id: "cervix-stenosis",
    shelf: "cervix",
    title: "Стenosis шейки",
    summary:
      "Cervical stenosis — hematometra/pyometra risk post-procedure или menopause; may cause infertility; dilation under guidance; exclude endocervical malignancy.",
    clinicalPearl:
      "Postmenopausal bleeding + stenosis — still need endometrial assessment (sonohysterography if needed).",
    excerpt:
      "Cervical stenosis may complicate sampling and requires careful dilation with exclusion of underlying pathology.",
    tier: 2,
    source: {
      label: "ACOG benign gynecologic conditions",
      organization: "ACOG",
      year: 2021,
    },
    tags: ["stenosis", "стenosis", "гематометра", "шейка"],
  },
  {
    id: "cervix-bishop-score",
    shelf: "cervix",
    title: "Bishop score · созревание",
    summary:
      "Bishop score (dilation, effacement, station, consistency, position) ≥6 favor successful induction; unfavorable cervix — ripening (prostaglandins, balloon) before oxytocin.",
    clinicalPearl:
      "TVUS CL не заменяет digital Bishop, но adjunct при uncertain cervix; document score before induction.",
    excerpt:
      "The Bishop score predicts likelihood of successful labor induction and guides cervical ripening.",
    tier: 1,
    source: {
      label: "NICE induction of labor",
      organization: "NICE",
      year: 2021,
    },
    tags: ["Bishop", "индукция", "созревание", "шейка", "роды"],
    relatedLinks: [{ label: "Помощник акушера", href: "/assistant/obstetrics" }],
  },
  {
    id: "cervix-self-sampling",
    shelf: "cervix",
    title: "Самозабор · HPV",
    summary:
      "Self-collected vaginal HPV samples — valid strategy to increase screening coverage; positive → clinic colposcopy; WHO supports in resource-limited and outreach programs.",
    clinicalPearl:
      "Patient education on kit use affects sensitivity; не заменяет full pelvic exam при symptomatic bleeding.",
    excerpt:
      "Self-sampling for HPV testing improves screening participation with colposcopic follow-up of positive results.",
    tier: 1,
    source: {
      label: "WHO self-care interventions · cervical screening",
      organization: "WHO",
      year: 2022,
    },
    tags: ["самозабор", "self-sampling", "HPV", "скрининг", "доступность"],
  },
  {
    id: "cervix-invasive-cancer-suspicion",
    shelf: "cervix",
    title: "Подозрение на рак шейки",
    summary:
      "Red flags: contact bleeding, friable mass, barrel-shaped cervix, hydronephrosis; urgent colposcopy/biopsy and staging; TVUS — local extension limited, MRI for staging.",
    clinicalPearl:
      "Не откладывать biopsy при gross lesion из-за «нужно сначала Pap»; Pap может быть false-negative при cancer.",
    excerpt:
      "Suspected invasive cervical cancer requires expedited colposcopic evaluation and biopsy without delay for cytology alone.",
    tier: 1,
    source: {
      label: "FIGO cervical cancer staging / NCCN",
      organization: "FIGO · NCCN",
      year: 2022,
    },
    tags: ["рак шейки", "cancer", "red flags", "staging", "biopsy"],
    relatedLinks: [{ label: "Нозология · шейка", href: "/nosologies/cervix-pathology" }],
  },
  {
    id: "cervix-transformation-zone",
    shelf: "cervix",
    title: "Зона трансформации · TZ types",
    summary:
      "TZ type 1 fully ectocervical, type 2 partially endocervical, type 3 endocervical — влияет на adequacy colposcopy и need for ECC; postmenopause TZ often recedes.",
    clinicalPearl:
      "Type 3 TZ + HSIL — higher miss rate без ECC; document TZ type в направлении на colposcopy.",
    excerpt:
      "Transformation zone type determines colposcopic adequacy and the need for endocervical assessment.",
    tier: 1,
    source: {
      label: "ISSVD colposcopy nomenclature",
      organization: "ISSVD",
      year: 2011,
    },
    tags: ["TZ", "transformation zone", "ECC", "кольпоскопия", "type 1", "type 2"],
  },
  {
    id: "cervix-postmenopause-screening",
    shelf: "cervix",
    title: "Скрининг · postmenopause",
    summary:
      "Continue screening until age defined by guideline (often 65 if prior adequate negative); HPV-primary or co-test intervals longer after negative; postmenopausal atrophy may cause false ASC-US.",
    clinicalPearl:
      "Atrophic cytology — local estrogen trial before repeat; persistent abnormality → colposcopy.",
    excerpt:
      "Cervical screening in postmenopausal women follows extended intervals after negative HPV-based tests until exit criteria are met.",
    tier: 1,
    source: {
      label: "ASCCP screening exit criteria",
      organization: "ASCCP",
      year: 2020,
    },
    tags: ["postmenopause", "менопауза", "скрининг", "атрофия", "65 лет"],
  },
  {
    id: "cervix-hpv-cotest-intervals",
    shelf: "cervix",
    title: "Co-test · интервалы",
    summary:
      "Negative co-test (HPV-/Pap-) — repeat 5 years in many protocols; HPV+/normal cytology — 1 year or genotype-dependent; HSIL never waits 3 years.",
    clinicalPearl:
      "Document both results in EMR; «normal Pap» при HPV+ — не routine 3-year return в modern ASCCP tables.",
    excerpt:
      "Screening intervals after co-testing depend on combined HPV and cytology results per risk-based guidelines.",
    tier: 1,
    source: {
      label: "ASCCP risk-based management",
      organization: "ASCCP",
      year: 2021,
    },
    tags: ["co-test", "интервал", "HPV", "цитология", "5 лет"],
  },
];
