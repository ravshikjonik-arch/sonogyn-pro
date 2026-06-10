import type { EvidenceEntry } from "../types";

/** Базовые темы FMF I триместра (ядро P0). */
export const US_FMF_CORE_EVIDENCE: EvidenceEntry[] = [
  {
    id: "fmf-nt-window",
    shelf: "us-fmf",
    title: "Срок измерения ТВП (NT)",
    summary:
      "Толщина воротникового пространства измеряют при КТР 45–84 мм, что соответствует 11+0–13+6 нед; вне окна — NT не используют для комбинированного скрининга I триместра.",
    clinicalPearl:
      "Перед NT: подтвердите КТР и срок; sagittal, neutral position, отделение амниона от плода; три одинаковых измерения, максимум в протокол.",
    excerpt:
      "Crown–rump length 45–84 mm defines the gestational window for NT measurement in first-trimester combined screening.",
    tier: 1,
    source: {
      label: "FMF / ISUOG first-trimester screening practice",
      organization: "FMF · ISUOG",
      year: 2023,
      url: "https://fetalmedicine.org/",
    },
    tags: ["NT", "ТВП", "I скрининг", "КТР", "11 нед", "13 нед", "FMF"],
    relatedLinks: [
      { label: "FMF · скрининги", href: "/assistant/fmf" },
      { label: "ISUOG курс", href: "/library/basic-course" },
    ],
  },
  {
    id: "fmf-combined-test",
    shelf: "us-fmf",
    title: "Комбинированный тест I триместра",
    summary:
      "Комбинированный скрининг: NT + материнские PAPP-A и свободный β-hCG → расчёт риска T21/T18/T13; эффективен только при точном сроке и качественном NT.",
    clinicalPearl:
      "Биохимия без корректного NT и КТР искажает риск; при отказе от NT рассматривают contingent / NIPT по локальному протоколу.",
    excerpt:
      "First-trimester combined screening integrates fetal NT with maternal serum PAPP-A and free β-hCG to estimate aneuploidy risk.",
    tier: 1,
    source: {
      label: "ISUOG Practice Guidelines: first-trimester screening",
      organization: "ISUOG",
      year: 2023,
      url: "https://www.isuog.org/",
    },
    tags: ["комбинированный тест", "PAPP-A", "β-hCG", "хCG", "анeuploidy", "T21", "скрининг"],
    relatedLinks: [{ label: "FMF · I скрининг", href: "/assistant/fmf" }],
  },
  {
    id: "fmf-papp-a-low",
    shelf: "us-fmf",
    title: "Сниженный PAPP-A",
    summary:
      "MoM PAPP-A <0.5 ассоциирован с повышенным риском T21 и, отдельно, с риском ранней преэклампсии / ЗРП — требует корреляции с УЗИ и анамнезом.",
    clinicalPearl:
      "Сообщайте риск преэклампсии при низком PAPP-A и рассмотрите протокол uterine artery PI / aspirin по локальным КР.",
    excerpt:
      "Low first-trimester PAPP-A is associated with increased risk of pre-eclampsia and fetal growth restriction in addition to aneuploidy.",
    tier: 1,
    source: {
      label: "FMF algorithm notes · pre-eclampsia screening",
      organization: "FMF",
      year: 2022,
    },
    tags: ["PAPP-A", "MoM", "преэклампсия", "ЗРП", "маркер"],
    relatedLinks: [{ label: "FMF · допплер", href: "/assistant/fmf" }],
  },
  {
    id: "fmf-nasal-bone",
    shelf: "us-fmf",
    title: "Носовая кость при скрининге",
    summary:
      "Отсутствие или гипоплазия носовой кости на 11–13+6 нед — маркер, повышающий пост-тестовую вероятность T21; оценивают в стандартных sagittal секциях.",
    clinicalPearl:
      "Не путать с shadowing; NB оценивают только в «окне» NT после подтверждения midsagittal plane.",
    excerpt:
      "Absent or hypoplastic nasal bone in the first trimester is used as an adjunct marker in trisomy 21 risk assessment.",
    tier: 1,
    source: {
      label: "ISUOG / FMF first-trimester markers",
      organization: "ISUOG · FMF",
      year: 2023,
    },
    tags: ["носовая кость", "NB", "T21", "маркер", "скрининг"],
    relatedLinks: [{ label: "FMF · I скрининг", href: "/assistant/fmf" }],
  },
  {
    id: "fmf-ductus-venosus",
    shelf: "us-fmf",
    title: "Венозный проток · a-wave",
    summary:
      "Реверс a-wave в венозном протоке на I скрининге — дополнительный маркер хромосомной патологии и сердечной дисфункции; не заменяет NT и биохимию.",
    clinicalPearl:
      "Измеряют при высоком априорном риске или abnormal NT; waveform в end-diastole — ключевой критерий.",
    excerpt:
      "Reversed a-wave in the ductus venosus Doppler waveform is an adjunct marker in first-trimester aneuploidy screening.",
    tier: 1,
    source: {
      label: "FMF Doppler protocol · ductus venosus",
      organization: "FMF",
      year: 2022,
    },
    tags: ["венозный проток", "ductus venosus", "допплер", "a-wave", "скрининг"],
    relatedLinks: [{ label: "FMF · допплер", href: "/assistant/fmf" }],
  },
  {
    id: "fmf-tricuspid-regurg",
    shelf: "us-fmf",
    title: "Трикуспидальная регургитация (TR)",
    summary:
      "Умеренная/тяжёлая TR на 11–13+6 нед повышает риск T21 и сердечных аномалий; оценивают color Doppler через tricuspid valve.",
    clinicalPearl:
      "Отличайте physiologic trivial TR от pathologic jet; документируйте view и длительность regurgitation.",
    excerpt:
      "Tricuspid regurgitation detected by color Doppler in the first trimester is an adjunct marker for chromosomal abnormalities.",
    tier: 1,
    source: {
      label: "ISUOG / FMF cardiac screening",
      organization: "ISUOG · FMF",
      year: 2023,
    },
    tags: ["TR", "трикуспидальная", "регургитация", "допплер", "сердце", "T21"],
    relatedLinks: [{ label: "FMF · I скрининг", href: "/assistant/fmf" }],
  },
  {
    id: "isuog-early-pregnancy-unknown-location",
    shelf: "us-fmf",
    title: "Беременность неизвестной локализации (PUL)",
    summary:
      "При положительной β-hCG и пустой матке — PUL до исключения extrauterine; повтор УЗИ через 48–72 ч или по β-hCG discriminatory zone, не «закрывать» случай одним визитом.",
    clinicalPearl:
      "Оцените adnexa, free fluid, corpus luteum; при боли/кровотечении — urgent pathway по протоколу.",
    excerpt:
      "Pregnancy of unknown location requires serial β-hCG and ultrasound follow-up before excluding ectopic pregnancy.",
    tier: 1,
    source: {
      label: "ISUOG Practice Guidelines: early pregnancy complications",
      organization: "ISUOG",
      year: 2023,
      url: "https://www.isuog.org/",
    },
    tags: ["ранняя беременность", "PUL", "внематочная", "β-hCG", "пустая матка"],
    relatedLinks: [
      { label: "Помощник акушера", href: "/assistant/obstetrics" },
      { label: "ISUOG лекция 6", href: "/library/basic-course" },
    ],
  },
  {
    id: "isuog-crl-dating",
    shelf: "us-fmf",
    title: "Датировка по КТР",
    summary:
      "В I триместре срок беременности для скрининга и рисков определяют по CRL (Robinson / Hadlock per local chart); LMP используют только если расхождение ≤5–7 дней.",
    clinicalPearl:
      "Записывайте среднее из ≥3 CRL; при расхождении LMP и CRL >7 дней — пересчёт по CRL.",
    excerpt:
      "First-trimester gestational age for screening should be based on CRL measurement when discrepancy with LMP exceeds accepted thresholds.",
    tier: 1,
    source: {
      label: "ISUOG · pregnancy dating",
      organization: "ISUOG",
      year: 2023,
    },
    tags: ["КТР", "CRL", "срок", "датировка", "LMP"],
    relatedLinks: [{ label: "FMF · малый срок", href: "/assistant/fmf" }],
  },
  {
    id: "fmf-cervical-length",
    shelf: "us-fmf",
    title: "Длина шейки матки · скрининг",
    summary:
      "Трансвагинальное измерение CL на 11–13+6 нед — часть алгоритма FMF для риска ранней родильности; короткая шейка требует тактики по локальному протоколу.",
    clinicalPearl:
      "Измерение: empty bladder TV, straight line internal os to external os, ≥3 измерения ≥10 мин apart — минимум.",
    excerpt:
      "Cervical length at 11–13 weeks contributes to spontaneous preterm birth risk stratification in FMF protocols.",
    tier: 1,
    source: {
      label: "FMF preterm birth screening",
      organization: "FMF",
      year: 2022,
    },
    tags: ["шейка матки", "CL", "cervical length", "преждевременные", "скрининг"],
    relatedLinks: [{ label: "FMF · I скрининг", href: "/assistant/fmf" }],
  },
  {
    id: "fmf-uterine-artery-pi",
    shelf: "us-fmf",
    title: "Uterine artery PI · преэклампсия",
    summary:
      "Средний PI маточных артерий на 11–13+6 нед + maternal factors — компонент FMF-скрининга преэклампсии; повышенный PI → обсуждение низкодозового aspirin по КР.",
    clinicalPearl:
      "Bilateral PI, высота sample at crossover; notching учитывают в алгоритме согласно FMF calculator.",
    excerpt:
      "First-trimester uterine artery Doppler PI integrates with maternal history for pre-eclampsia risk prediction.",
    tier: 1,
    source: {
      label: "FMF pre-eclampsia screening algorithm",
      organization: "FMF",
      year: 2023,
    },
    tags: ["uterine artery", "PI", "преэклампсия", "допплер", "маточные артерии"],
    relatedLinks: [{ label: "FMF · допплер", href: "/assistant/fmf" }],
  },
  {
    id: "isuog-anomaly-scan-timing",
    shelf: "us-fmf",
    title: "Срок малого аномального сканирования",
    summary:
      "Стандартный II тримester anomaly scan: 18+0–22+6 нед (локальные протоколы могут 19–21); структурная анатомия и soft markers по ISUOG checklist.",
    clinicalPearl:
      "При ожирении / retroverted uterus — сдвиг срока или repeat views; документируйте ограничения визуализации.",
    excerpt:
      "ISUOG recommends mid-trimester fetal anomaly scan typically between 18 and 22+6 weeks using standardized views.",
    tier: 1,
    source: {
      label: "ISUOG Practice Guidelines: mid-trimester scan",
      organization: "ISUOG",
      year: 2023,
    },
    tags: ["II триместр", "anomaly scan", "18 нед", "22 нед", "структурные аномалии"],
    relatedLinks: [{ label: "ISUOG курс", href: "/library/basic-course" }],
  },
  {
    id: "fmf-nt-quality",
    shelf: "us-fmf",
    title: "Качество измерения NT",
    summary:
      "NT invalid при: не midsagittal plane, fetal hyperextension/flexion, amnion not separated, calipers не on inner borders; только valid NT идёт в risk calculator.",
    clinicalPearl:
      "FMF certification требует audit images; при сомнении — remeasure или senior review.",
    excerpt:
      "NT must be measured with strict plane criteria; suboptimal images should not enter the risk algorithm.",
    tier: 1,
    source: {
      label: "FMF NT measurement protocol",
      organization: "FMF",
      year: 2023,
    },
    tags: ["NT", "качество", "измерение", "протокол", "FMF"],
    relatedLinks: [{ label: "FMF · I скрининг", href: "/assistant/fmf" }],
  },
  {
    id: "isuog-fhr-early",
    shelf: "us-fmf",
    title: "ЧСС плода · ранняя беременность",
    summary:
      "ЧСС 6–7 нед: 100–120 уд/мин; к 9 нед ~170–180; bradycardia <100 на 7–8 нед — неблагоприятный прогностический признак, нужен контроль.",
    clinicalPearl:
      "M-mode или directed pulse-wave; не полагаться на maternal pulse или artifact.",
    excerpt:
      "Embryonic heart rate increases to a peak near 9 weeks; persistent bradycardia is associated with pregnancy loss.",
    tier: 1,
    source: {
      label: "ISUOG early pregnancy guidance",
      organization: "ISUOG",
      year: 2023,
    },
    tags: ["ЧСС", "FHR", "ранняя беременность", "bradycardia", "6 нед", "9 нед"],
    relatedLinks: [{ label: "Помощник акушера", href: "/assistant/obstetrics" }],
  },
  {
    id: "fmf-contingent-nipt",
    shelf: "us-fmf",
    title: "Contingent модель и NIPT",
    summary:
      "При промежуточном риске после combined test — contingent pathway: повтор маркеров / NIPT по протоколу; high risk → invasive diagnosis counseling.",
    clinicalPearl:
      "Документируйте pre-test counseling и выбранную ветку; NIPT — screening, не diagnostic без invasive confirm при high risk.",
    excerpt:
      "Contingent screening strategies use first-trimester results to triage cfDNA testing or invasive diagnosis.",
    tier: 1,
    source: {
      label: "ISUOG / FMF aneuploidy screening update",
      organization: "ISUOG · FMF",
      year: 2023,
    },
    tags: ["NIPT", "contingent", "инвазивная", "риск", "T21", "скрининг"],
    relatedLinks: [{ label: "FMF · I скрининг", href: "/assistant/fmf" }],
  },
  {
    id: "isuog-growth-assessment",
    shelf: "us-fmf",
    title: "Оценка роста плода · основы",
    summary:
      "EFW по формулам (Hadlock et al.) сопоставляют с перцентилями; isolated single measure без doppler/context — не диагноз ЗРП; нужна dynamics.",
    clinicalPearl:
      "Head, abdomen, femur — triplane; note percentile chart (INTERGROWTH / local); repeat in 2–3 weeks if borderline.",
    excerpt:
      "Fetal biometry should be interpreted using validated charts and serial assessment when growth restriction is suspected.",
    tier: 1,
    source: {
      label: "ISUOG Practice Guidelines: fetal growth",
      organization: "ISUOG",
      year: 2023,
    },
    tags: ["ЗРП", "FGR", "EFW", "биометрия", "перцентили", "Hadlock"],
    relatedLinks: [
      { label: "FMF · III триместр", href: "/assistant/fmf" },
      { label: "Калькуляторы", href: "/calculators" },
    ],
  },
];
