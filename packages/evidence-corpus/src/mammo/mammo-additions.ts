import type { EvidenceEntry } from "../types";

/** Дополнения полки mammo — специальные случаи и тактика. */
export const MAMMO_ADDITIONAL_EVIDENCE: EvidenceEntry[] = [
  {
    id: "mammo-complicated-cyst",
    shelf: "mammo",
    title: "Complicated cyst · осложнённая киста",
    summary:
      "Internal echoes, debris, septations without solid vascular nodules — often BI-RADS 3 with follow-up; move to 4 if solid component or growth.",
    clinicalPearl:
      "Move wall vigorously — debris shifts; fixed solid mural nodule → biopsy regardless of cyst appearance.",
    excerpt:
      "Complicated cysts may be managed with surveillance when no solid vascular components are present.",
    tier: 1,
    source: { label: "ACR BI-RADS US", organization: "ACR", year: 2025 },
    tags: ["complicated cyst", "debris", "septa", "BI-RADS 3"],
    relatedLinks: [{ label: "BI-RADS Pro", href: "/calculators/bi-rads" }],
  },
  {
    id: "mammo-phyllodes",
    shelf: "mammo",
    title: "Phyllodes tumor",
    summary:
      "Fast-growing solid mass, often lobulated, may have cystic spaces — BI-RADS 4; excision with margins; distinguish from fibroadenoma histologically.",
    clinicalPearl:
      "Rapid growth over weeks — red flag; US cannot reliably distinguish benign vs borderline phyllodes.",
    excerpt:
      "Phyllodes tumors require tissue diagnosis and wide local excision due to recurrence potential.",
    tier: 2,
    source: { label: "NCCN phyllodes guidelines", organization: "NCCN", year: 2024 },
    tags: ["phyllodes", "филloides", "быстрый рост", "solid mass"],
  },
  {
    id: "mammo-papillary-lesion",
    shelf: "mammo",
    title: "Papillary lesion · intraductal",
    summary:
      "Intraductal papilloma vs papillary carcinoma — often BI-RADS 4; serous/bloody nipple discharge indication; US may show dilated duct with intraluminal mass.",
    clinicalPearl:
      "Terminal duct papilloma behind nipple — targeted US + biopsy; MRI adjunct in selected cases.",
    excerpt:
      "Solitary papillary lesions with nipple discharge warrant tissue diagnosis due to carcinoma risk.",
    tier: 1,
    source: { label: "ACR BI-RADS / SBI", organization: "ACR", year: 2024 },
    tags: ["papilloma", "papillary", "discharge", "duct", "BI-RADS 4"],
  },
  {
    id: "mammo-fat-necrosis",
    shelf: "mammo",
    title: "Fat necrosis",
    summary:
      "Post-trauma/surgery: mixed echogenicity, oil cysts, may mimic cancer — correlation with history; often BI-RADS 2–3; biopsy if no trauma history.",
    clinicalPearl:
      "Architectural distortion without mass — compare with prior imaging; biopsy if new and no explanation.",
    excerpt:
      "Fat necrosis may mimic malignancy; clinical history and follow-up imaging aid differentiation.",
    tier: 2,
    source: { label: "ACR breast trauma imaging", organization: "ACR", year: 2024 },
    tags: ["fat necrosis", "травма", "oil cyst", "post-op"],
  },
  {
    id: "mammo-duct-ectasia",
    shelf: "mammo",
    title: "Duct ectasia",
    summary:
      "Dilated subareolar ducts, often bilateral, benign; BI-RADS 2 if no intraductal mass; differentiate papillary lesion if focal solid component.",
    clinicalPearl:
      "Green/black nipple discharge alone — duct ectasia common; bloody discharge — papilloma pathway.",
    excerpt:
      "Mammary duct ectasia is a benign condition unless associated with intraductal mass or atypical discharge.",
    tier: 2,
    source: { label: "RCOG / breast benign disease", organization: "RCOG", year: 2023 },
    tags: ["duct ectasia", "протоки", "discharge", "benign"],
  },
  {
    id: "mammo-male-breast",
    shelf: "mammo",
    title: "Male breast · gynecomastia vs cancer",
    summary:
      "Gynecomastia: fan-shaped retroareolar tissue; carcinoma: eccentric solid mass, skin retraction — biopsy BI-RADS 4–5 patterns apply.",
    clinicalPearl:
      "Klinefelter, medications, liver disease — gynecomastia causes; unilateral firm mass in older man — biopsy.",
    excerpt:
      "Male breast cancer is rare but requires biopsy of suspicious solid masses using BI-RADS principles.",
    tier: 1,
    source: { label: "ACR male breast imaging", organization: "ACR", year: 2024 },
    tags: ["male breast", "gynecomastia", "мужская МЖ", "cancer"],
  },
  {
    id: "mammo-calcifications-us",
    shelf: "mammo",
    title: "Calcifications · US role",
    summary:
      "Microcalcifications primarily mammographic finding; US detects associated mass, guides biopsy of mass; calcifications alone often not visible on US.",
    clinicalPearl:
      "When mammo shows calcifications + US mass — biopsy target is mass; stereotactic if US-negative.",
    excerpt:
      "Ultrasound complements mammography for calcification-associated masses but does not replace mammographic calcification assessment.",
    tier: 1,
    source: { label: "ACR BI-RADS mammography/US correlation", organization: "ACR", year: 2025 },
    tags: ["calcifications", "microcalcifications", "mammography", "correlation"],
  },
  {
    id: "mammo-post-biopsy-changes",
    shelf: "mammo",
    title: "Post-biopsy · hematoma/scar",
    summary:
      "Post-core biopsy hematoma common; BI-RADS 2–3 short follow-up; clip marker documents site; imaging-pathology concordance mandatory.",
    clinicalPearl:
      "6-week follow-up US after benign concordant biopsy; discordant → re-biopsy or excision.",
    excerpt:
      "Post-biopsy changes require concordance assessment and interval imaging to confirm resolution.",
    tier: 1,
    source: { label: "ACR imaging-guided biopsy standards", organization: "ACR", year: 2024 },
    tags: ["biopsy", "hematoma", "clip", "concordance", "follow-up"],
  },
  {
    id: "mammo-dense-breast",
    shelf: "mammo",
    title: "Dense breast · supplemental US",
    summary:
      "Mammographic density reduces sensitivity; supplemental screening US or MRI in high-risk/dense breast per regional law and protocol — not replacement for mammography.",
    clinicalPearl:
      "Document density category if mammography available; US finds more cancers but also more benign biopsies.",
    excerpt:
      "Supplemental ultrasound may increase cancer detection in dense breasts within defined screening programs.",
    tier: 1,
    source: { label: "ACR breast density reporting", organization: "ACR", year: 2024 },
    tags: ["dense breast", "плотная ткань", "supplemental US", "screening"],
  },
  {
    id: "mammo-intramammary-node",
    shelf: "mammo",
    title: "Intramammary lymph node",
    summary:
      "Oval hypoechoic mass with echogenic hilum in outer breast — BI-RADS 2 if classic; verify hilum and cortex thickness.",
    clinicalPearl:
      "Loss of fatty hilum or eccentric cortex thickening — treat as suspicious node, not BI-RADS 2.",
    excerpt:
      "Typical intramammary lymph nodes with preserved fatty hila are benign BI-RADS 2 findings.",
    tier: 1,
    source: { label: "ACR BI-RADS US", organization: "ACR", year: 2025 },
    tags: ["intramammary node", "лимфоузел", "hilum", "BI-RADS 2"],
  },
  {
    id: "mammo-nipple-retraction",
    shelf: "mammo",
    title: "Nipple retraction / skin changes",
    summary:
      "New retraction, peau d'orange, ulceration — red flags for malignancy even without discrete mass; targeted US + mammography, BI-RADS 4–5 pathway.",
    clinicalPearl:
      "Subareolar carcinoma may be subtle on US — low threshold for MRI/mammo correlation.",
    excerpt:
      "Nipple and skin changes require complete diagnostic imaging even when no palpable mass is identified.",
    tier: 1,
    source: { label: "NCCN breast cancer screening", organization: "NCCN", year: 2024 },
    tags: ["nipple retraction", "skin", "peau d'orange", "red flags"],
  },
  {
    id: "mammo-follow-up-intervals",
    shelf: "mammo",
    title: "Follow-up · интервалы BI-RADS 3",
    summary:
      "Probably benign: initial 6-month US, then 6-month, then 12-month, then incorporate into screening if stable ~2–3 years total surveillance before long-term screening.",
    clinicalPearl:
      "Growth or new suspicious feature during surveillance → upgrade category and biopsy.",
    excerpt:
      "BI-RADS 3 lesions undergo structured short-interval follow-up before return to routine screening.",
    tier: 1,
    source: { label: "ACR BI-RADS follow-up tables", organization: "ACR", year: 2025 },
    tags: ["follow-up", "6 months", "surveillance", "BI-RADS 3"],
    relatedLinks: [{ label: "BI-RADS Pro", href: "/calculators/bi-rads" }],
  },
  {
    id: "mammo-inflammatory-carcinoma",
    shelf: "mammo",
    title: "Inflammatory breast cancer",
    summary:
      "Diffuse skin thickening, edema, erythema >1/3 breast, often no discrete mass — emergency oncologic workup; US shows dermal lymphatic involvement pattern.",
    clinicalPearl:
      "Mastitis not responding 1 week antibiotics — biopsy skin and parenchyma; do not label «mastitis» repeatedly.",
    excerpt:
      "Inflammatory breast cancer presents with rapid breast erythema and edema requiring urgent biopsy and staging.",
    tier: 1,
    source: { label: "NCCN inflammatory breast cancer", organization: "NCCN", year: 2024 },
    tags: ["inflammatory", "IBC", "кожа", "edema", "red flags"],
  },
  {
    id: "mammo-reporting-structure",
    shelf: "mammo",
    title: "Протокол УЗИ МЖ · структура",
    summary:
      "Structured report: indication, tissue composition, finding(s) with lexicon descriptors, axilla, final BI-RADS category, management recommendation — mirrors ACR mandatory elements.",
    clinicalPearl:
      "Copy-paste «кистозно-фibрозные изменения» without category — не соответствует BI-RADS; всегда final assessment.",
    excerpt:
      "Structured BI-RADS ultrasound reports include standardized descriptors and an explicit management recommendation.",
    tier: 1,
    source: { label: "ACR BI-RADS US reporting", organization: "ACR", year: 2025 },
    tags: ["протокол", "reporting", "lexicon", "structured"],
    relatedLinks: [{ label: "BI-RADS Pro", href: "/calculators/bi-rads" }],
  },
  {
    id: "mammo-palpable-lump-pathway",
    shelf: "mammo",
    title: "Palpable lump · маршрут",
    summary:
      "Age ≥30: diagnostic mammography + targeted US same visit when possible; age <30: US first; palpable correlates with US finding — biopsy if BI-RADS ≥4.",
    clinicalPearl:
      "Mark skin entry point for targeted US; negative US with persistent palpable lump — still consider biopsy/MRI per protocol.",
    excerpt:
      "Palpable breast lumps require targeted ultrasound and age-appropriate mammography with biopsy of suspicious findings.",
    tier: 1,
    source: { label: "NICE / ACR palpable lump pathway", organization: "NICE · ACR", year: 2024 },
    tags: ["palpable", "комок", "diagnostic", "triple assessment"],
  },
];
