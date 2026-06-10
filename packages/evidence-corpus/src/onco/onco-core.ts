import type { EvidenceEntry } from "../types";

/** Ядро полки «Онкология» — O-RADS US, IOTA, red flags. */
export const ONCO_CORE_EVIDENCE: EvidenceEntry[] = [
  {
    id: "onco-orads-overview",
    shelf: "onco",
    title: "O-RADS US · категории 0–5",
    summary:
      "O-RADS US stratifies adnexal masses: 0 incomplete, 1 normal, 2 almost certainly benign, 3 low risk, 4 intermediate, 5 high risk of malignancy; drives gynecologic oncology referral.",
    clinicalPearl:
      "В протоколе — O-RADS category + key descriptors (locules, solid, papillary, color score); используйте калькулятор для согласованности.",
    excerpt:
      "O-RADS ultrasound risk stratification standardizes management of adnexal masses.",
    tier: 1,
    source: {
      label: "ACR O-RADS US v2022",
      organization: "ACR",
      year: 2022,
    },
    tags: ["O-RADS", "придатки", "яичник", "категория", "risk"],
    relatedLinks: [
      { label: "O-RADS Pro", href: "/calculators/o-rads" },
      { label: "Атлас яичника", href: "/ovary-atlas" },
      { label: "O-RADS эхограммы", href: "/library/orads-echograms" },
    ],
  },
  {
    id: "onco-orads-2",
    shelf: "onco",
    title: "O-RADS 2 · almost certainly benign",
    summary:
      "Typical benign lesions: simple cyst, classic dermoid, paraovarian cyst, hydrosalpinx (classic), endometrioma with typical features — routine follow-up or expectant management.",
    clinicalPearl:
      "Endometrioma и hemorrhagic cyst — O-RADS 2–3 depending on atypia; document «ground glass» vs reticular pattern.",
    excerpt:
      "O-RADS 2 lesions have minimal malignancy risk and typically require no surgical intervention.",
    tier: 1,
    source: { label: "ACR O-RADS US", organization: "ACR", year: 2022 },
    tags: ["O-RADS 2", "benign", "simple cyst", "dermoid"],
    relatedLinks: [{ label: "O-RADS Pro", href: "/calculators/o-rads" }],
  },
  {
    id: "onco-orads-3",
    shelf: "onco",
    title: "O-RADS 3 · low risk",
    summary:
      "Low risk (~1–<10%): unilocular/bilocular smooth cyst ≥10 cm, small solid component rules, selected hemorrhagic cysts — gynecology follow-up or MRI/short-interval US.",
    clinicalPearl:
      "Size matters in O-RADS 3 — document maximal diameter; postmenopausal solid any size → higher category.",
    excerpt:
      "O-RADS 3 masses warrant gynecologic follow-up with consideration of MRI or interval imaging.",
    tier: 1,
    source: { label: "ACR O-RADS US", organization: "ACR", year: 2022 },
    tags: ["O-RADS 3", "low risk", "large cyst", "follow-up"],
    relatedLinks: [{ label: "O-RADS Pro", href: "/calculators/o-rads" }],
  },
  {
    id: "onco-orads-4",
    shelf: "onco",
    title: "O-RADS 4 · intermediate risk",
    summary:
      "Intermediate risk: multilocular smooth, solid smooth <7 cm premenopausal, papillary projections without meeting O-RADS 5 — gynecologic evaluation, often surgery or MRI.",
    clinicalPearl:
      "Color score 3–4 with papillary projections upgrades risk — document on color Doppler.",
    excerpt:
      "O-RADS 4 lesions require specialist evaluation and often surgical assessment.",
    tier: 1,
    source: { label: "ACR O-RADS US", organization: "ACR", year: 2022 },
    tags: ["O-RADS 4", "intermediate", "multilocular", "solid"],
    relatedLinks: [{ label: "O-RADS Pro", href: "/calculators/o-rads" }],
  },
  {
    id: "onco-orads-5",
    shelf: "onco",
    title: "O-RADS 5 · high risk",
    summary:
      "High risk features: solid irregular ≥4 color score, ascites + mass, peritoneal nodules, large solid postmenopausal — urgent gynecologic oncology referral.",
    clinicalPearl:
      "Ascites alone with adnexal mass — O-RADS 5 until proven otherwise; CA-125 adjunct not diagnostic alone.",
    excerpt:
      "O-RADS 5 adnexal masses require prompt evaluation for ovarian malignancy.",
    tier: 1,
    source: { label: "ACR O-RADS US", organization: "ACR", year: 2022 },
    tags: ["O-RADS 5", "malignancy", "ascites", "solid", "high risk"],
    relatedLinks: [{ label: "O-RADS Pro", href: "/calculators/o-rads" }],
  },
  {
    id: "onco-iota-simple-rules-b",
    shelf: "onco",
    title: "IOTA Simple Rules · B-features",
    summary:
      "Benign B-features: unilocular, solid <7 mm, presence of acoustic shadows, smooth multilocular <10 cm — high NPV in expert hands; integrated into O-RADS/IOTA 2026 workflow.",
    clinicalPearl:
      "Apply rules only if classic; any M-feature overrides — do not force benign classification.",
    excerpt:
      "IOTA benign simple rules identify low-risk adnexal masses when applied by trained operators.",
    tier: 1,
    source: { label: "IOTA Simple Rules / consensus 2026", organization: "IOTA", year: 2026 },
    tags: ["IOTA", "Simple Rules", "B-features", "benign"],
    relatedLinks: [{ label: "O-RADS Pro", href: "/calculators/o-rads" }],
  },
  {
    id: "onco-iota-simple-rules-m",
    shelf: "onco",
    title: "IOTA Simple Rules · M-features",
    summary:
      "Malignant M-features: irregular solid, ascites, ≥4 papillary structures, irregular multilocular, prominent vascularity — high PPV; triggers O-RADS 4–5 pathway.",
    clinicalPearl:
      "Even one M-feature → do not discharge as functional cyst; document which M-feature triggered.",
    excerpt:
      "IOTA malignant simple rules identify adnexal masses requiring specialist evaluation.",
    tier: 1,
    source: { label: "IOTA Simple Rules", organization: "IOTA", year: 2026 },
    tags: ["IOTA", "M-features", "malignant", "papillary", "ascites"],
    relatedLinks: [{ label: "O-RADS Pro", href: "/calculators/o-rads" }],
  },
  {
    id: "onco-color-score",
    shelf: "onco",
    title: "Color score · vascularity",
    summary:
      "O-RADS color score 1–4 based on flow within solid component or papillary projections; score 4 (very strong flow) increases malignancy risk especially with solid lesions.",
    clinicalPearl:
      "Use lowest PRF to detect slow flow; score papillary projection vascularity separately from wall flow.",
    excerpt:
      "Adnexal lesion color Doppler scoring contributes to O-RADS malignancy risk assessment.",
    tier: 1,
    source: { label: "ACR O-RADS US color score", organization: "ACR", year: 2022 },
    tags: ["color score", "допплер", "vascularity", "papillary"],
    relatedLinks: [{ label: "O-RADS Pro", href: "/calculators/o-rads" }],
  },
  {
    id: "onco-endometrioma",
    shelf: "onco",
    title: "Endometrioma vs malignancy",
    summary:
      "Typical endometrioma: unilocular, ground-glass, no solid nodules — O-RADS 2; atypical: multilocular, papillary excrescences, rapid growth — upgrade category and consider MRI/oncology.",
    clinicalPearl:
      "Endometrioma can coexist with endometrioid cancer — solid vascular nodule inside cyst is not «typical endometrioma».",
    excerpt:
      "Typical ovarian endometriomas are benign; atypical features require higher O-RADS classification.",
    tier: 1,
    source: { label: "IOTA / O-RADS endometrioma", organization: "IOTA · ACR", year: 2022 },
    tags: ["endometrioma", "эндометриома", "ground glass", "atypical"],
    relatedLinks: [{ label: "IDEA · эндометриоз", href: "/idea-deep-endometriosis" }],
  },
  {
    id: "onco-dermoid",
    shelf: "onco",
    title: "Mature teratoma · dermoid",
    summary:
      "Classic dermoid: hyperechoic Rokitansky nodule, fat-fluid level, comet-tail — O-RADS 2; torsion risk if large; rupture rare; do not confuse with lipoleiomyoma of adnexa.",
    clinicalPearl:
      "Solid vascular component outside typical dermoid pattern — not O-RADS 2; document Rokitansky nodule.",
    excerpt:
      "Typical mature cystic teratomas are benign O-RADS 2 lesions with characteristic ultrasound features.",
    tier: 1,
    source: { label: "ACR O-RADS US dermoid", organization: "ACR", year: 2022 },
    tags: ["dermoid", "teratoma", "Rokitansky", "O-RADS 2"],
    relatedLinks: [{ label: "O-RADS Pro", href: "/calculators/o-rads" }],
  },
  {
    id: "onco-endometrial-cancer-us",
    shelf: "onco",
    title: "Endometrial cancer · УЗИ-скрининг",
    summary:
      "Postmenopausal bleeding + ET >4–5 mm (without HRT) — endometrial sampling; irregular endometrium, vascular pedicle, heterogeneous thickening — red flags; US cannot exclude grade.",
    clinicalPearl:
      "Saline infusion sonography or hysteroscopy if focal lesion suspected; document endometrial thickness measurement method.",
    excerpt:
      "Transvaginal ultrasound endometrial thickness guides biopsy decisions in postmenopausal bleeding.",
    tier: 1,
    source: { label: "ESGO/ESHRE endometrial cancer guideline", organization: "ESGO", year: 2022 },
    tags: ["endometrial cancer", "эндометрий", "ET", "postmenopause", "PMPB"],
    relatedLinks: [{ label: "Калькулятор эндометрия", href: "/calculators/endometrium" }],
  },
  {
    id: "onco-ca125-use",
    shelf: "onco",
    title: "CA-125 · когда использовать",
    summary:
      "CA-125 not for population screening; adjunct in postmenopausal adnexal mass risk models (RMI/ROMA); elevated in endometriosis, PID, liver disease — low specificity.",
    clinicalPearl:
      "Normal CA-125 не исключает early ovarian cancer; не откладывайте O-RADS 4–5 referral из-за normal tumor marker.",
    excerpt:
      "CA-125 is an adjunct biomarker for adnexal mass evaluation, not a screening test for ovarian cancer.",
    tier: 1,
    source: { label: "RCOG / NICE ovarian mass pathways", organization: "RCOG", year: 2022 },
    tags: ["CA-125", "tumor marker", "RMI", "ROMA", "screening"],
  },
  {
    id: "onco-ovarian-screening",
    shelf: "onco",
    title: "Скрининг рака яичника",
    summary:
      "No effective population screening for ovarian cancer (US + CA-125 in general population not recommended); high-risk carriers (BRCA) — specialized surveillance protocols.",
    clinicalPearl:
      "Incidental adnexal cyst on screening US elsewhere — apply O-RADS, not «annual CA-125».",
    excerpt:
      "Population screening for ovarian cancer is not recommended due to insufficient evidence of mortality benefit.",
    tier: 1,
    source: { label: "USPSTF / RCOG ovarian screening", organization: "USPSTF", year: 2024 },
    tags: ["screening", "ovarian cancer", "BRCA", "CA-125", "population"],
  },
  {
    id: "onco-emergency-adnexal",
    shelf: "onco",
    title: "Adnexal emergency · red flags",
    summary:
      "Torsion, ruptured hemorrhagic cyst, ectopic pregnancy, tubo-ovarian abscess — acute pain; malignancy mimic: ruptured cancer rare but consider if complex mass + ascites.",
    clinicalPearl:
      "Doppler in torsion variable; do not delay surgery for «rule out cancer» in unstable torsion.",
    excerpt:
      "Acute adnexal emergencies require urgent evaluation distinct from elective O-RADS triage.",
    tier: 1,
    source: { label: "ACOG acute adnexal mass", organization: "ACOG", year: 2021 },
    tags: ["emergency", "torsion", "acute pain", "adnexal"],
    relatedLinks: [{ label: "O-RADS Pro", href: "/calculators/o-rads" }],
  },
  {
    id: "onco-hydrosalpinx",
    shelf: "onco",
    title: "Hydrosalpinx · classic",
    summary:
      "Incomplete septa, sausage-shaped, hypoechoic content, separate ovary — O-RADS 2; differentiate from multilocular cystadenoma (O-RADS 4) and paraovarian cyst.",
    clinicalPearl:
      "Cogwheel incomplete septa + tubular shape pathognomonic; document ovary separately from tube.",
    excerpt:
      "Classic hydrosalpinx has characteristic tubular ultrasound morphology and is usually O-RADS 2.",
    tier: 1,
    source: { label: "ACR O-RADS US hydrosalpinx", organization: "ACR", year: 2022 },
    tags: ["hydrosalpinx", "гидrosalpinx", "tube", "O-RADS 2"],
    relatedLinks: [{ label: "O-RADS Pro", href: "/calculators/o-rads" }],
  },
];
