import type { EvidenceEntry } from "../types";

/** Дополнения полки onco — FIGO, эндометрий, перitoneum, КР РФ. */
export const ONCO_ADDITIONAL_EVIDENCE: EvidenceEntry[] = [
  {
    id: "onco-papillary-projections",
    shelf: "onco",
    title: "Papillary projections · O-RADS",
    summary:
      "Papillary projections (≥3 mm) into cyst lumen — count, surface smooth vs irregular, vascularity (color score); ≥4 papillae or irregular surface → high O-RADS category.",
    clinicalPearl:
      "Distinguish clot vs papillary — lack of vascularity supports clot; avascular may still need follow-up if atypical.",
    excerpt:
      "Papillary projection number, morphology, and vascularity are central O-RADS descriptors.",
    tier: 1,
    source: { label: "ACR O-RADS US", organization: "ACR", year: 2022 },
    tags: ["papillary", "excrescence", "projection", "O-RADS"],
    relatedLinks: [{ label: "O-RADS Pro", href: "/calculators/o-rads" }],
  },
  {
    id: "onco-solid-adnexal-mass",
    shelf: "onco",
    title: "Solid adnexal mass",
    summary:
      "Predominantly solid adnexal mass: smooth vs irregular margins, color score, size, menopausal status — postmenopausal solid mass high risk; premenopausal <7 cm smooth may be O-RADS 4.",
    clinicalPearl:
      "Fibroma/fibrothecoma benign solid — smooth, shadowing; still document and follow O-RADS unless classic.",
    excerpt:
      "Solid adnexal masses require structured O-RADS assessment with menopause status and Doppler scoring.",
    tier: 1,
    source: { label: "ACR O-RADS US solid lesions", organization: "ACR", year: 2022 },
    tags: ["solid mass", "solid", "adnexal", "fibroma"],
    relatedLinks: [{ label: "O-RADS Pro", href: "/calculators/o-rads" }],
  },
  {
    id: "onco-ascites-peritoneal",
    shelf: "onco",
    title: "Ascites + peritoneal nodules",
    summary:
      "Ascites with adnexal mass or omental/peritoneal nodules strongly suggests advanced ovarian malignancy; O-RADS 5; paracentesis cytology adjunct, urgent oncology.",
    clinicalPearl:
      "Benign Meigs syndrome (fibroma + ascites + pleural effusion) rare — exclude solid irregular mass first.",
    excerpt:
      "Ascites and peritoneal implants in the setting of adnexal mass indicate high risk of malignancy.",
    tier: 1,
    source: { label: "FIGO ovarian cancer staging", organization: "FIGO", year: 2021 },
    tags: ["ascites", "peritoneal", "nodules", "stage", "O-RADS 5"],
  },
  {
    id: "onco-figo-ovarian-staging",
    shelf: "onco",
    title: "FIGO · стadiирование яичника",
    summary:
      "FIGO 2014 ovarian staging I–IV based on surgery/imaging: extension to pelvis, peritoneum, nodes; US role — detect ascites, deposits, residual disease surveillance.",
    clinicalPearl:
      "Preoperative US documents laterality, size, solid components, ascites — surgical planning, not substitute for staging laparotomy/laparoscopy.",
    excerpt:
      "FIGO staging defines ovarian cancer extent; imaging supports detection of advanced disease features.",
    tier: 1,
    source: { label: "FIGO ovarian cancer staging 2014/2021", organization: "FIGO", year: 2021 },
    tags: ["FIGO", "staging", "ovarian cancer", "stage III", "stage IV"],
  },
  {
    id: "onco-endometrial-hyperplasia-cancer",
    shelf: "onco",
    title: "Hyperplasia vs endometrial cancer",
    summary:
      "Endometrial hyperplasia without atypia — medical management; atypical hyperplasia/ EIN — high progression risk, hysterectomy often; US thickness alone cannot grade.",
    clinicalPearl:
      "Focal thickening on SIS worse than diffuse thin hyperplasia; biopsy gold standard.",
    excerpt:
      "Histology distinguishes endometrial hyperplasia from carcinoma; ultrasound guides sampling indications.",
    tier: 1,
    source: { label: "ESHRE/ESGO endometrial guidelines", organization: "ESHRE", year: 2022 },
    tags: ["hyperplasia", "atypia", "EIN", "endometrial cancer"],
    relatedLinks: [{ label: "Калькулятор эндометрия", href: "/calculators/endometrium" }],
  },
  {
    id: "onco-pmpb-pathway",
    shelf: "onco",
    title: "Postmenopausal bleeding · маршрут",
    summary:
      "All PMPB evaluated — TVUS ET, endometrial biopsy; recurrent bleeding after benign biopsy needs repeat/ hysteroscopy; do not attribute solely to atrophy without sampling.",
    clinicalPearl:
      "Endometrial polyp on SIS — directed polypectomy; thin ET <4 mm reduces but does not eliminate cancer if bleeding persists.",
    excerpt:
      "Postmenopausal bleeding requires endometrial assessment regardless of apparent benign ultrasound findings.",
    tier: 1,
    source: { label: "NICE NG12 suspected cancer pathway", organization: "NICE", year: 2023 },
    tags: ["PMPB", "postmenopause", "bleeding", "biopsy", "pathway"],
    relatedLinks: [{ label: "Калькулятор эндометрия", href: "/calculators/endometrium" }],
  },
  {
    id: "onco-lynch-endometrial",
    shelf: "onco",
    title: "Lynch syndrome · endometrial",
    summary:
      "Lynch (HNPCC) — high endometrial and ovarian cancer risk; lower threshold for biopsy; annual/endometrial screening in carriers per genetics protocol.",
    clinicalPearl:
      "Young patient with endometrial cancer or strong family history — genetics referral; US not sufficient screening alone.",
    excerpt:
      "Lynch syndrome carriers require enhanced endometrial surveillance beyond population screening.",
    tier: 1,
    source: { label: "NCCN Lynch syndrome guidelines", organization: "NCCN", year: 2024 },
    tags: ["Lynch", "HNPCC", "genetics", "endometrial", "BRCA"],
  },
  {
    id: "onco-malignant-ascites-workup",
    shelf: "onco",
    title: "Malignant ascites · workup",
    summary:
      "New ascites + adnexal/omental findings — cytology, CA-125, CT chest/abdomen/pelvis; primary may be ovarian, GI, peritoneal mesothelioma — multidisciplinary.",
    clinicalPearl:
      "US first in gynecologic clinic — document omental cake, peritoneal thickening, pleural effusion.",
    excerpt:
      "New ascites with adnexal or peritoneal abnormalities requires malignancy workup including imaging and cytology.",
    tier: 1,
    source: { label: "ESGO ovarian cancer diagnosis", organization: "ESGO", year: 2022 },
    tags: ["malignant ascites", "cytology", "omental", "workup"],
  },
  {
    id: "onco-kr-rf-gyn-cancer",
    shelf: "onco",
    title: "КР РФ · гинекологические онкологии",
    summary:
      "КР МЗ РФ по раку шейки, тела матки, яичника — маршрутизация в онкодиспансер, объём диагностики, хирургия и adjuvant по стадии; УЗИ — первичная визуализация в амбulatorии.",
    clinicalPearl:
      "При подозрении O-RADS 5 / PMPB с толстым эндометрием — направление по онкомаршруту региона без задержки на «контроль через 3 мес».",
    excerpt:
      "Russian clinical guidelines define referral and staging pathways for gynecologic cancers.",
    tier: 1,
    source: { label: "КР МЗ РФ · онкогинекология", organization: "МЗ РФ", year: 2021 },
    tags: ["КР РФ", "онкология", "маршрут", "Russia"],
    relatedLinks: [{ label: "КР и приказы", href: "/guidelines" }],
  },
  {
    id: "onco-orads-0-incomplete",
    shelf: "onco",
    title: "O-RADS 0 · incomplete",
    summary:
      "O-RADS 0: mass not fully characterized — need MRI, specialist US, or follow-up when limits of modality (bowel gas, large habitus); assign category after complete evaluation.",
    clinicalPearl:
      "Document why incomplete — «ovary not visualized» vs «mass partially seen»; do not default to O-RADS 2.",
    excerpt:
      "O-RADS 0 indicates incomplete adnexal mass characterization requiring additional imaging.",
    tier: 1,
    source: { label: "ACR O-RADS US", organization: "ACR", year: 2022 },
    tags: ["O-RADS 0", "incomplete", "MRI", "follow-up"],
    relatedLinks: [{ label: "O-RADS Pro", href: "/calculators/o-rads" }],
  },
  {
    id: "onco-paraovarian-cyst",
    shelf: "onco",
    title: "Paraovarian cyst",
    summary:
      "Separate from ovary, simple unilocular — O-RADS 2; confirm ovary distinct on all planes; torsion rare but possible.",
    clinicalPearl:
      "Trace ovarian tissue around cyst; mislabeling ovarian cyst as paraovarian changes follow-up plan.",
    excerpt:
      "Typical paraovarian cysts are benign when clearly separate from the ovary with simple features.",
    tier: 1,
    source: { label: "ACR O-RADS US", organization: "ACR", year: 2022 },
    tags: ["paraovarian", "paratubal", "O-RADS 2", "simple"],
    relatedLinks: [{ label: "O-RADS Pro", href: "/calculators/o-rads" }],
  },
  {
    id: "onco-mucinous-cystadenoma",
    shelf: "onco",
    title: "Mucinous cystadenoma · triage",
    summary:
      "Large multilocular mucinous tumors can be benign, borderline, or malignant — size >10 cm, solid areas, papillae upgrade O-RADS; MRI helps characterize locules.",
    clinicalPearl:
      "Mucinous tumors may be huge — document size and peritoneal spread (pseudomyxoma rare from ovary).",
    excerpt:
      "Large multilocular mucinous adnexal masses require careful O-RADS classification and often surgery.",
    tier: 2,
    source: { label: "IOTA multilocular mass data", organization: "IOTA", year: 2022 },
    tags: ["mucinous", "cystadenoma", "multilocular", "large"],
    relatedLinks: [{ label: "O-RADS Pro", href: "/calculators/o-rads" }],
  },
  {
    id: "onco-reporting-orads",
    shelf: "onco",
    title: "Протокол · O-RADS lexicon",
    summary:
      "Mandatory: laterality, size, locularity, solid components (%), papillary features, color score, ascites, O-RADS category, recommendation — aligns with ACR and IOTA 2026 consensus.",
    clinicalPearl:
      "«Киста яичника» без category — incomplete report; link to O-RADS Pro for structured text.",
    excerpt:
      "Structured O-RADS reporting improves communication and appropriate referral for adnexal masses.",
    tier: 1,
    source: { label: "ACR O-RADS US reporting", organization: "ACR", year: 2022 },
    tags: ["reporting", "протокол", "lexicon", "O-RADS"],
    relatedLinks: [
      { label: "O-RADS Pro", href: "/calculators/o-rads" },
      { label: "O-RADS эхограммы", href: "/library/orads-echograms" },
    ],
  },
  {
    id: "onco-premenopausal-complex-cyst",
    shelf: "onco",
    title: "Premenopausal complex cyst",
    summary:
      "Hemorrhagic corpus luteum, endometrioma, dermoid common; follow-up 6–12 weeks for resolution unless M-features; avoid immediate surgery for typical CL cyst.",
    clinicalPearl:
      "Document menstrual phase and β-hCG; ruptured CL — free fluid may mimic ascites.",
    excerpt:
      "Many complex adnexal masses in premenopausal women resolve spontaneously and require interval imaging.",
    tier: 1,
    source: { label: "RCOG adnexal mass management", organization: "RCOG", year: 2022 },
    tags: ["premenopausal", "hemorrhagic", "corpus luteum", "follow-up"],
    relatedLinks: [{ label: "O-RADS Pro", href: "/calculators/o-rads" }],
  },
  {
    id: "onco-postmenopausal-simple-cyst",
    shelf: "onco",
    title: "Postmenopausal simple cyst",
    summary:
      "Simple unilocular anechoic ≤3 cm — O-RADS 2, may follow-up; >3 cm or any solid component — higher category; do not ignore postmenopausal adnexal cyst entirely.",
    clinicalPearl:
      "Annual follow-up for persistent simple cysts >3 cm postmenopause per O-RADS tables.",
    excerpt:
      "Postmenopausal simple ovarian cysts have size-dependent O-RADS classification and follow-up requirements.",
    tier: 1,
    source: { label: "ACR O-RADS US postmenopause", organization: "ACR", year: 2022 },
    tags: ["postmenopause", "simple cyst", "3 cm", "O-RADS 2"],
    relatedLinks: [{ label: "O-RADS Pro", href: "/calculators/o-rads" }],
  },
];
