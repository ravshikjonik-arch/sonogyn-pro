import type { EvidenceEntry } from "../types";

/** Дополнения полки obgyn — акушерство, роды, гинекологические red flags. */
export const OBGYN_ADDITIONAL_EVIDENCE: EvidenceEntry[] = [
  {
    id: "obgyn-preterm-birth",
    shelf: "obgyn",
    title: "Преterm birth · профилактика",
    summary:
      "Short cervical length (<25 mm до 24 нед) — high risk; vaginal progesterone или cerclage по протоколу; history of PTB — enhanced surveillance и CL monitoring.",
    clinicalPearl:
      "CL измеряют transvaginal, empty bladder, без давления на шейку; funneling документируют в протоколе.",
    excerpt:
      "Cervical length screening identifies women at increased risk of spontaneous preterm birth who may benefit from progesterone or cerclage.",
    tier: 1,
    source: {
      label: "ISUOG / SMFM preterm birth prevention",
      organization: "ISUOG · SMFM",
      year: 2022,
    },
    tags: ["преterm", "ПР", "CL", "шейка", "progesterone", "цервикальная недостаточность"],
    relatedLinks: [{ label: "Калькулятор CL", href: "/calculators/cervical-length" }],
  },
  {
    id: "obgyn-prom",
    shelf: "obgyn",
    title: "ПРПО · преждevremенный разрыв плодных оболочек",
    summary:
      "Подтверждение: speculum exam, pooling, positive nitrazine/ferning; при preterm PROM — latency antibiotics, corticosteroids, magnesium if indicated; исключить chorioamnionitis.",
    clinicalPearl:
      "Оligohydramnios + history of fluid leakage — поддерживает PROM; оцените fetal presentation и placental location.",
    excerpt:
      "Preterm prelabor rupture of membranes requires confirmation of membrane rupture and protocol-based maternal-fetal management.",
    tier: 1,
    source: {
      label: "RCOG / ACOG PROM guidelines",
      organization: "RCOG",
      year: 2022,
    },
    tags: ["ПРПО", "PROM", "околоплодные воды", "nitrazine", "latency"],
    relatedLinks: [{ label: "Помощник акушера", href: "/assistant/obstetrics" }],
  },
  {
    id: "obgyn-placenta-previa",
    shelf: "obgyn",
    title: "Предлежание / vasa previa",
    summary:
      "Placenta previa — placenta covers internal os ≥20 нед; repeat imaging 32–36 нед; planned cesarean; vasa previa — vessels over os, risk of fetal exsanguination при rupture membranes.",
    clinicalPearl:
      "Transvaginal probe safe для low-lying placenta; map distance from os; при suspection vasa previa — color Doppler over internal os.",
    excerpt:
      "Placenta previa and vasa previa require late-pregnancy reassessment and delivery planning to reduce hemorrhagic complications.",
    tier: 1,
    source: {
      label: "ISUOG placenta accreta / previa guideline",
      organization: "ISUOG",
      year: 2022,
    },
    tags: ["предлежание", "placenta previa", "vasa previa", "плацента"],
    relatedLinks: [{ label: "Помощник акушера", href: "/assistant/obstetrics" }],
  },
  {
    id: "obgyn-placenta-accreta",
    shelf: "obgyn",
    title: "Placenta accreta spectrum",
    summary:
      "Risk factors: prior cesarean + placenta previa, multiple CS; US signs: loss of retroplacental clear space, bladder wall interruption, placental lacunae; delivery in tertiary center.",
    clinicalPearl:
      "Suspect accreta при anterior placenta previa + scar; 3D/color Doppler и MRI по протоколу; не планируйте manual removal.",
    excerpt:
      "Ultrasound markers of placenta accreta spectrum support referral to specialized centers for multidisciplinary delivery planning.",
    tier: 1,
    source: {
      label: "FIGO / ISUOG placenta accreta guideline",
      organization: "FIGO · ISUOG",
      year: 2022,
    },
    tags: ["accreta", "placenta accreta", "cesarean scar", "placenta previa"],
    relatedLinks: [{ label: "Помощник акушера", href: "/assistant/obstetrics" }],
  },
  {
    id: "obgyn-rh-isoimmunization",
    shelf: "obgyn",
    title: "Rh-изoimmunization · профилактика",
    summary:
      "Rh(D)-negative: anti-D prophylaxis 28 нед и postpartum при Rh+ fetus; после sensitizing events (bleeding, trauma, invasive procedures) — additional dose within 72 h.",
    clinicalPearl:
      "При подозрении alloimmunization — middle cerebral artery peak systolic velocity для fetal anemia; не полагайтесь только на AFI.",
    excerpt:
      "Routine anti-D immunoglobulin prophylaxis prevents Rh alloimmunization in unsensitized Rh-negative pregnancies.",
    tier: 1,
    source: {
      label: "RCOG / ACOG Rh management",
      organization: "RCOG",
      year: 2022,
    },
    tags: ["Rh", "resus", "anti-D", "изoimmunization", "MCA-PSV"],
    relatedLinks: [{ label: "Помощник акушера", href: "/assistant/obstetrics" }],
  },
  {
    id: "obgyn-fgr-delivery",
    shelf: "obgyn",
    title: "ЗРП / FGR · timing delivery",
    summary:
      "Early-onset FGR (<32 нед) — intensive Doppler (UA, MCA, CPR, DV); late FGR — growth curves, amniotic fluid, CTG; timing по severity и gestational age по протоколу (TRUFFLE/ Delphi consensus).",
    clinicalPearl:
      "Absent/reversed end-diastolic flow in UA — high risk; document EFW percentile, Doppler pattern, biophysical profile components.",
    excerpt:
      "Fetal growth restriction management integrates Doppler findings and gestational age to optimize timing of delivery.",
    tier: 1,
    source: {
      label: "ISUOG FGR guideline / Delphi consensus",
      organization: "ISUOG",
      year: 2023,
    },
    tags: ["ЗРП", "FGR", "IUGR", "допплер", "CPR", "роды"],
    relatedLinks: [{ label: "FMF · допплер", href: "/assistant/fmf" }],
  },
  {
    id: "obgyn-induction-labor",
    shelf: "obgyn",
    title: "Индукция родов · показания",
    summary:
      "Показания: post-term, PROM at term, maternal/fetal indications; Bishop score guides method; failed induction — reassess cervix and consider cesarean per protocol.",
    clinicalPearl:
      "TVUS CL optional adjunct; при unfavorable cervix — ripening agents before oxytocin.",
    excerpt:
      "Labor induction indications and cervical assessment (Bishop score) guide choice of ripening and augmentation strategies.",
    tier: 1,
    source: {
      label: "WHO / NICE induction of labor",
      organization: "WHO · NICE",
      year: 2022,
    },
    tags: ["индукция", "Bishop", "роды", "post-term", "окситоцин"],
    relatedLinks: [{ label: "Помощник акушера", href: "/assistant/obstetrics" }],
  },
  {
    id: "obgyn-pph",
    shelf: "obgyn",
    title: "Postpartum hemorrhage",
    summary:
      "Primary PPH >500 ml vaginal / >1000 ml cesarean; causes 4T: tone, trauma, tissue, thrombin; active management third stage; uterotonics, balloon tamponade, surgery escalation.",
    clinicalPearl:
      "TVUS postpartum — retained products vs hematoma; не delay uterotonics для «полного» УЗИ при ongoing bleeding.",
    excerpt:
      "Primary postpartum hemorrhage requires immediate uterotonic therapy and systematic evaluation of the four T causes.",
    tier: 1,
    source: {
      label: "FIGO / WHO PPH recommendations",
      organization: "FIGO · WHO",
      year: 2022,
    },
    tags: ["PPH", "кровотечение", "послеродовое", "atonía", "4T"],
    relatedLinks: [{ label: "Помощник акушера", href: "/assistant/obstetrics" }],
  },
  {
    id: "obgyn-ovarian-mass-triage",
    shelf: "obgyn",
    title: "Образование яичника · triage",
    summary:
      "Premenopausal: simple cyst <5 cm — follow-up; postmenopausal simple ≤3 cm low risk; solid, papillary projections, ascites — oncologic pathway; O-RADS US standardizes reporting.",
    clinicalPearl:
      "Применяйте O-RADS lexicon в протоколе: unilocular/bilocular, solid components, color score; CA-125 не для routine screening.",
    excerpt:
      "O-RADS ultrasound classification provides structured risk stratification for adnexal masses.",
    tier: 1,
    source: {
      label: "ACR O-RADS US v2022",
      organization: "ACR",
      year: 2022,
    },
    tags: ["O-RADS", "яичник", "киста", "oncology", "triage"],
    relatedLinks: [
      { label: "O-RADS Pro", href: "/calculators/o-rads" },
      { label: "Атлас яичника", href: "/ovary-atlas" },
    ],
  },
  {
    id: "obgyn-asherman",
    shelf: "obgyn",
    title: "Синдrome Ашерман",
    summary:
      "Intrauterine adhesions после curettage/ infection; amenorrhea or hypomenorrhea, infertility, recurrent loss; diagnosis: sonohysterography or hysteroscopy; treatment hysteroscopic adhesiolysis.",
    clinicalPearl:
      "3D sonohysterography или SIS: irregular cavity, synechiae; endometrium может быть thin and heterogeneous.",
    excerpt:
      "Asherman syndrome should be suspected after uterine instrumentation with menstrual disturbance or infertility.",
    tier: 2,
    source: {
      label: "ESHRE uterine factor infertility guideline",
      organization: "ESHRE",
      year: 2021,
    },
    tags: ["Ашерман", "Asherman", "синехии", "спаечный процесс", "гистероскопия"],
    relatedLinks: [{ label: "Помощник АГ", href: "/assistant/gynecology" }],
  },
  {
    id: "obgyn-perimenopause-bleeding",
    shelf: "obgyn",
    title: "Кровотечение в perimenopause",
    summary:
      "Endometrial cancer risk rises with age and obesity; postmenopausal bleeding always warrants endometrial assessment; perimenopause — TVUS + biopsy при persistent AUB or risk factors.",
    clinicalPearl:
      "Endometrial thickness alone insufficient in premenopause; focal lesions — saline infusion sonography or hysteroscopy.",
    excerpt:
      "Endometrial evaluation is mandatory for postmenopausal bleeding and selected perimenopausal abnormal bleeding cases.",
    tier: 1,
    source: {
      label: "NICE / ESGO endometrial cancer pathways",
      organization: "NICE · ESGO",
      year: 2022,
    },
    tags: ["perimenopause", "postmenopause", "эндометрий", "рак endometrium", "AUB"],
    relatedLinks: [{ label: "Калькулятор эндометрия", href: "/calculators/endometrium" }],
  },
  {
    id: "obgyn-cervical-insufficiency",
    shelf: "obgyn",
    title: "Цervical insufficiency",
    summary:
      "History-based: prior second-trimester loss with painless dilation; ultrasound: CL <25 mm before 24 weeks without contractions; cerclage indicated in selected history or short CL cohorts.",
    clinicalPearl:
      "Не путать с preterm labor — наличие contractions меняет тактику; CL dynamic change важнее single measurement.",
    excerpt:
      "Cervical cerclage reduces preterm birth in women with history of cervical insufficiency or short cervical length in selected protocols.",
    tier: 1,
    source: {
      label: "ISUOG cervical assessment guideline",
      organization: "ISUOG",
      year: 2022,
    },
    tags: ["цervical insufficiency", "cerclage", "CL", "шейка", "II триместр"],
    relatedLinks: [{ label: "Калькулятор CL", href: "/calculators/cervical-length" }],
  },
  {
    id: "obgyn-chorioamnionitis",
    shelf: "obgyn",
    title: "Chorioamnionitis · подозрение",
    summary:
      "Maternal fever + fetal tachycardia ± uterine tenderness ± purulent discharge; intrapartum antibiotics и expedited delivery; neonatal sepsis risk — координация с neonatology.",
    clinicalPearl:
      "Placenta pathology confirms histologic chorioamnionitis postpartum; на УЗИ — poly/oligohydramnios nonspecific.",
    excerpt:
      "Clinical chorioamnionitis during labor requires prompt antibiotic therapy and delivery to reduce neonatal infection.",
    tier: 1,
    source: {
      label: "ACOG intrapartum fever / chorioamnionitis",
      organization: "ACOG",
      year: 2020,
    },
    tags: ["chorioamnionitis", "внутриутробная инфекция", "лихорадка", "тахикардия плода"],
    relatedLinks: [{ label: "Помощник акушера", href: "/assistant/obstetrics" }],
  },
  {
    id: "obgyn-pprom-term",
    shelf: "obgyn",
    title: "PROM at term",
    summary:
      "Term PROM: confirm rupture, GBS status, induce labor generally within 24 h; expectant management only if no infection/maternal-fetal contraindications.",
    clinicalPearl:
      "AFI может быть normal early after PROM — не отменяет диагноз при типичной клинике и positive tests.",
    excerpt:
      "Term prelabor rupture of membranes is usually managed with induction of labor to reduce infection risk.",
    tier: 1,
    source: {
      label: "NICE / ACOG term PROM",
      organization: "NICE",
      year: 2022,
    },
    tags: ["PROM", "term", "излитие вод", "индукция", "GBS"],
    relatedLinks: [{ label: "Помощник акушера", href: "/assistant/obstetrics" }],
  },
  {
    id: "obgyn-submucous-fertility",
    shelf: "obgyn",
    title: "Submucous myoma · фертильность",
    summary:
      "FIGO type 0–2 myomas distort cavity and reduce implantation; hysteroscopic myomectomy improves outcomes; intramural without cavity distortion — individualized counseling.",
    clinicalPearl:
      "SIS/3D TVUS для submucous mapping перед репродуктивной тактикой; размер и % intracavitary protrusion в протоколе.",
    excerpt:
      "Submucous leiomyomas are associated with infertility and pregnancy loss; cavity-distorting fibroids warrant resection.",
    tier: 1,
    source: {
      label: "FIGO / ESHRE fibroids and fertility",
      organization: "FIGO · ESHRE",
      year: 2021,
    },
    tags: ["submucous", "фертильность", "миома", "FIGO 0", "FIGO 1", "FIGO 2"],
    relatedLinks: [
      { label: "Калькулятор FIGO", href: "/calculators/figo" },
      { label: "Срез матки 3D", href: "/uterus-3d" },
    ],
  },
];
