import type { EvidenceEntry } from "../types";

/** Ядро полки «Маммология» — BI-RADS US, тактика по образованиям МЖ. */
export const MAMMO_CORE_EVIDENCE: EvidenceEntry[] = [
  {
    id: "mammo-birads-overview",
    shelf: "mammo",
    title: "BI-RADS US · категории 0–6",
    summary:
      "BI-RADS US stratifies breast lesions: 0 incomplete, 2 benign, 3 probably benign (short-interval follow-up), 4 suspicious (biopsy), 5 highly suggestive of malignancy, 6 known cancer; assessment drives management.",
    clinicalPearl:
      "В протоколе — final assessment category + recommendation; не смешивайте описательные признаки без итоговой категории.",
    excerpt:
      "BI-RADS ultrasound assessment categories standardize reporting and management recommendations for breast lesions.",
    tier: 1,
    source: {
      label: "ACR BI-RADS Ultrasound v2025",
      organization: "ACR",
      year: 2025,
    },
    tags: ["BI-RADS", "категория", "US", "молочная железа", "assessment"],
    relatedLinks: [
      { label: "Калькулятор BI-RADS", href: "/calculators/bi-rads" },
      { label: "Эластография", href: "/calculators/elastography" },
    ],
  },
  {
    id: "mammo-birads-2",
    shelf: "mammo",
    title: "BI-RADS 2 · доброкачественное",
    summary:
      "Category 2: classic benign findings (simple cyst, typical fibroadenoma, intramammary node) — routine age-appropriate screening interval; no biopsy.",
    clinicalPearl:
      "Simple anechoic oval mass with posterior enhancement — типичный cyst; document wall and contents before BI-RADS 2.",
    excerpt:
      "BI-RADS category 2 lesions are benign with no imaging follow-up beyond routine screening.",
    tier: 1,
    source: { label: "ACR BI-RADS US", organization: "ACR", year: 2025 },
    tags: ["BI-RADS 2", "benign", "киста", "fibroadenoma"],
    relatedLinks: [{ label: "BI-RADS Pro", href: "/calculators/bi-rads" }],
  },
  {
    id: "mammo-birads-3",
    shelf: "mammo",
    title: "BI-RADS 3 · probably benign",
    summary:
      "Category 3: ≤2% malignancy risk — short-interval follow-up (usually 6 months × 2–3 years) then annual; includes typical complicated cyst, probable fibroadenoma in low-risk context.",
    clinicalPearl:
      "Не ставьте BI-RADS 3 при palpable mass у high-risk patient без согласования с протоколом — many centers prefer biopsy.",
    excerpt:
      "BI-RADS 3 lesions warrant short-interval ultrasound surveillance rather than immediate biopsy in appropriate cases.",
    tier: 1,
    source: { label: "ACR BI-RADS US management", organization: "ACR", year: 2025 },
    tags: ["BI-RADS 3", "probably benign", "контроль", "6 месяцев"],
    relatedLinks: [{ label: "BI-RADS Pro", href: "/calculators/bi-rads" }],
  },
  {
    id: "mammo-birads-4",
    shelf: "mammo",
    title: "BI-RADS 4 · подозрительное",
    summary:
      "Category 4: biopsy should be performed; subcategories 4A/4B/4C reflect increasing suspicion; includes irregular solid masses and atypical calcification patterns on US correlation.",
    clinicalPearl:
      "Core needle biopsy preferred; document mass location clock-face + distance from nipple для concordance.",
    excerpt:
      "BI-RADS 4 assessments indicate sufficient suspicion to recommend tissue sampling.",
    tier: 1,
    source: { label: "ACR BI-RADS US", organization: "ACR", year: 2025 },
    tags: ["BI-RADS 4", "biopsy", "подозрительное", "4A", "4B", "4C"],
    relatedLinks: [{ label: "BI-RADS Pro", href: "/calculators/bi-rads" }],
  },
  {
    id: "mammo-birads-5",
    shelf: "mammo",
    title: "BI-RADS 5 · highly suspicious",
    summary:
      "Category 5: ≥95% probability of malignancy — biopsy mandatory, staging workup; spiculated irregular hypoechoic mass with angular margins classic pattern.",
    clinicalPearl:
      "Mark lesion for ultrasound-guided biopsy; assess axillary nodes same session if suspicious.",
    excerpt:
      "BI-RADS 5 lesions carry high probability of malignancy and require biopsy and oncologic coordination.",
    tier: 1,
    source: { label: "ACR BI-RADS US", organization: "ACR", year: 2025 },
    tags: ["BI-RADS 5", "malignancy", "spiculated", "рак МЖ"],
    relatedLinks: [{ label: "BI-RADS Pro", href: "/calculators/bi-rads" }],
  },
  {
    id: "mammo-mass-descriptors",
    shelf: "mammo",
    title: "Mass · shape, margin, orientation",
    summary:
      "US descriptors: shape oval/round/irregular; margin circumscribed vs microlobulated/indistinct/angular/spiculated; orientation parallel vs non-parallel (taller-than-wide) — key for malignancy risk.",
    clinicalPearl:
      "Non-parallel orientation + spiculated margin — red flags; document in standard lexicon before category assignment.",
    excerpt:
      "Sonographic mass shape, margin, and orientation are core predictors integrated into BI-RADS assessment.",
    tier: 1,
    source: { label: "ACR BI-RADS US lexicon", organization: "ACR", year: 2025 },
    tags: ["mass", "margin", "spiculated", "orientation", "lexicon"],
    relatedLinks: [{ label: "BI-RADS Pro", href: "/calculators/bi-rads" }],
  },
  {
    id: "mammo-simple-cyst",
    shelf: "mammo",
    title: "Simple cyst · простая киста",
    summary:
      "Anechoic, oval, circumscribed, posterior enhancement, no internal vascularity — BI-RADS 2; aspiration only if symptomatic or diagnostic uncertainty.",
    clinicalPearl:
      "Compressibility and thin wall confirm cyst; internal echoes or septations → complicated cyst pathway.",
    excerpt:
      "Classic simple breast cysts are benign and classified as BI-RADS 2 without biopsy.",
    tier: 1,
    source: { label: "ACR BI-RADS US", organization: "ACR", year: 2025 },
    tags: ["киста", "simple cyst", "anechoic", "BI-RADS 2"],
    relatedLinks: [{ label: "BI-RADS Pro", href: "/calculators/bi-rads" }],
  },
  {
    id: "mammo-fibroadenoma",
    shelf: "mammo",
    title: "Fibroadenoma · фибroadenoma",
    summary:
      "Typical fibroadenoma: oval parallel mass, circumscribed, homogeneous, possibly gentle lobulations — BI-RADS 3 or 2 if classic in young woman; biopsy if atypical features.",
    clinicalPearl:
      "Giant or calcifying fibroadenoma in older patient — lower threshold for biopsy; elastography adjunct optional.",
    excerpt:
      "Typical fibroadenomas in young women may be managed with surveillance when imaging features are classic.",
    tier: 1,
    source: { label: "ACR BI-RADS / EFSUMB", organization: "ACR", year: 2025 },
    tags: ["fibroadenoma", "фибroadenoma", "молодая", "oval mass"],
    relatedLinks: [
      { label: "BI-RADS Pro", href: "/calculators/bi-rads" },
      { label: "Эластография", href: "/calculators/elastography" },
    ],
  },
  {
    id: "mammo-galactocele",
    shelf: "mammo",
    title: "Galactocele · лактocele",
    summary:
      "Lactation-related: mixed echogenicity with fat-fluid level pathognomonic; BI-RADS 2; differentiate from abscess (fever, hyperemia) and carcinoma.",
    clinicalPearl:
      "History of lactation/ recent weaning key; fat-fluid level on US — document sagittal plane.",
    excerpt:
      "Galactoceles show characteristic fat-fluid levels and are benign in the lactating breast.",
    tier: 2,
    source: { label: "Radiopaedia / ACR breast lactation", organization: "ACR", year: 2024 },
    tags: ["galactocele", "лактация", "fat-fluid", "беременность"],
  },
  {
    id: "mammo-abscess-mastitis",
    shelf: "mammo",
    title: "Abscess / mastitis",
    summary:
      "Inflammatory mass with hyperemia, skin thickening, possible fluid collection — clinical diagnosis; US guides drainage; not BI-RADS 5 by default if classic infection.",
    clinicalPearl:
      "Poor response to antibiotics → biopsy to exclude inflammatory carcinoma; document doppler and probe tenderness correlation.",
    excerpt:
      "Breast abscess and mastitis require clinical correlation; imaging guides drainage and exclusion of malignancy when atypical.",
    tier: 1,
    source: { label: "ACR breast infection guidance", organization: "ACR", year: 2024 },
    tags: ["mastitis", "abscess", "воспаление", "лактация"],
  },
  {
    id: "mammo-axillary-node",
    shelf: "mammo",
    title: "Axillary lymph node · УЗИ",
    summary:
      "Normal node: fatty hilum, thin cortex; suspicious: cortical thickening >3 mm, loss of hilum, round shape — biopsy and correlation with breast primary.",
    clinicalPearl:
      "Always scan axilla when BI-RADS 4–5 breast mass; abnormal node may upstage without palpable tumor.",
    excerpt:
      "Ultrasound assessment of axillary lymph nodes is integral to breast cancer staging when nodes appear abnormal.",
    tier: 1,
    source: { label: "ACR axillary node ultrasound", organization: "ACR", year: 2024 },
    tags: ["axilla", "лимфоузел", "hilum", "cortex", "метастasis"],
  },
  {
    id: "mammo-elastography",
    shelf: "mammo",
    title: "Эlastography · adjunct",
    summary:
      "Strain/SWE elastography adds stiffness data to BI-RADS assessment for indeterminate masses; not standalone — integrates with morphology per local protocol.",
    clinicalPearl:
      "Use same lesion on B-mode and elastogram; stiff benign fibroadenomas exist — do not skip biopsy on elastogram alone.",
    excerpt:
      "Breast elastography is an adjunct tool that may downgrade or upgrade suspicion for selected BI-RADS 3–4 lesions.",
    tier: 2,
    source: { label: "EFSUMB breast elastography guidelines", organization: "EFSUMB", year: 2023 },
    tags: ["elastography", "эластография", "SWE", "strain", "adjunct"],
    relatedLinks: [{ label: "Калькулятор эластографии", href: "/calculators/elastography" }],
  },
  {
    id: "mammo-pregnancy-lactation",
    shelf: "mammo",
    title: "Беременность / лактация · МЖ",
    summary:
      "Increased glandular tissue limits sensitivity; US first-line for palpable abnormality; avoid routine screening mammography in pregnancy; biopsy safe with coordination.",
    clinicalPearl:
      "Lactational adenoma vs carcinoma — biopsy if any solid irregular mass persists after infection treated.",
    excerpt:
      "Ultrasound is the primary imaging modality for breast symptoms during pregnancy and lactation.",
    tier: 1,
    source: { label: "ACOG / ACR pregnancy breast imaging", organization: "ACOG · ACR", year: 2023 },
    tags: ["беременность", "лактация", "МЖ", "screening"],
  },
  {
    id: "mammo-birads-0",
    shelf: "mammo",
    title: "BI-RADS 0 · incomplete",
    summary:
      "Category 0: need additional imaging (comparison films, spot compression US, mammography correlation) before final assessment; not a final diagnosis.",
    clinicalPearl:
      "Return to BI-RADS 0 only when prior studies unavailable — document what additional views needed.",
    excerpt:
      "BI-RADS 0 indicates incomplete evaluation requiring additional imaging before management decisions.",
    tier: 1,
    source: { label: "ACR BI-RADS US", organization: "ACR", year: 2025 },
    tags: ["BI-RADS 0", "incomplete", "дополнительное исследование"],
    relatedLinks: [{ label: "BI-RADS Pro", href: "/calculators/bi-rads" }],
  },
  {
    id: "mammo-screening-kr-rf",
    shelf: "mammo",
    title: "Скрининг МЖ · КР РФ",
    summary:
      "Population mammography screening по возрасту и программе региона; US — для dense breasts или дополнение по протоколу; palpable lump bypasses screening pathway → diagnostic workup.",
    clinicalPearl:
      "Сверяйте возрастные группы с локальным приказом; BI-RADS assessment един для screening и diagnostic US.",
    excerpt:
      "Russian screening programs define mammography intervals with ultrasound adjuncts per regional protocols.",
    tier: 1,
    source: { label: "КР МЗ РФ · рак молочной железы", organization: "МЗ РФ", year: 2021 },
    tags: ["скрининг", "мammography", "КР РФ", "МЖ", "Russia"],
    relatedLinks: [{ label: "КР и приказы", href: "/guidelines" }],
  },
];
