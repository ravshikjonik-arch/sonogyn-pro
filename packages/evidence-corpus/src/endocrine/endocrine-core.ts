import type { EvidenceEntry } from "../types";

/** Ядро полки «Эндокринология · гин.» — СПКЯ, AMH, щитовидная. */
export const ENDOCRINE_CORE_EVIDENCE: EvidenceEntry[] = [
  {
    id: "endo-pcos-diagnosis",
    shelf: "endocrine",
    title: "СПКЯ · диагностика Rotterdam+",
    summary:
      "PCOS: ≥2 из oligo/anovulation, clinical/biochemical hyperandrogenism, polycystic ovarian morphology (≥20 follicles/ovary или volume ≥10 ml) после исключения thyroid disease, hyperprolactinemia, CAH, androgen-secreting tumors.",
    clinicalPearl:
      "У подростка — диагноз осторожно; «polycystic» яичник alone не СПКЯ; AMH повышен, но не критерий Rotterdam.",
    excerpt:
      "PCOS diagnosis requires two Rotterdam criteria after exclusion of mimicking endocrine disorders.",
    tier: 1,
    source: { label: "ESHRE/ASRM PCOS guideline 2023", organization: "ESHRE", year: 2023 },
    tags: ["СПКЯ", "PCOS", "Rotterdam", "диагноз", "hyperandrogenism"],
    relatedLinks: [{ label: "Помощник АГ", href: "/assistant/gynecology" }],
  },
  {
    id: "endo-pcos-us-morphology",
    shelf: "endocrine",
    title: "СПКЯ · УЗИ-морфология яичников",
    summary:
      "PCOM: ≥20 follicles 2–9 mm in one ovary and/or ovarian volume ≥10 ml on TVUS; antral follicle count correlates with AMH; exclude multifollicular normal ovary in early postmenarche.",
    clinicalPearl:
      "Measure volume formula 0.5 × L × W × H; document follicle count per ovary, not total across both only.",
    excerpt:
      "Polycystic ovarian morphology on ultrasound is one diagnostic pillar of PCOS when criteria are met.",
    tier: 1,
    source: { label: "ESHRE PCOS ultrasound criteria", organization: "ESHRE", year: 2023 },
    tags: ["PCOM", "фollikлы", "объём яичника", "20 follicles", "УЗИ"],
    relatedLinks: [{ label: "O-RADS Pro", href: "/calculators/o-rads" }],
  },
  {
    id: "endo-amh-fertility",
    shelf: "endocrine",
    title: "AMH · ovarian reserve",
    summary:
      "AMH reflects antral follicle pool; lower with age and POI; elevated in PCOS; used in fertility counseling and IVF protocol planning — not sole predictor of natural conception.",
    clinicalPearl:
      "Assay variability between labs — compare to local reference; oral contraceptives suppress AMH temporarily.",
    excerpt:
      "Anti-Müllerian hormone estimates ovarian reserve and supports reproductive counseling.",
    tier: 1,
    source: { label: "ESHRE ovarian reserve testing", organization: "ESHRE", year: 2023 },
    tags: ["AMH", "ovarian reserve", "резерв", "фертильность", "ЭКО"],
  },
  {
    id: "endo-amh-poi",
    shelf: "endocrine",
    title: "POI · premature ovarian insufficiency",
    summary:
      "POI: oligo/amenorrhea <40 years + elevated FSH (confirm ×2) ± low AMH; causes include genetics, autoimmunity, iatrogenic; not «early menopause» without workup.",
    clinicalPearl:
      "Spontaneous pregnancy possible in POI — counsel on fertility options; karyotype and adrenal antibodies per protocol.",
    excerpt:
      "Premature ovarian insufficiency requires confirmed elevated gonadotropins before age 40.",
    tier: 1,
    source: { label: "ESHRE POI guideline", organization: "ESHRE", year: 2024 },
    tags: ["POI", "ранний климакс", "FSH", "AMH", "ановуляция"],
  },
  {
    id: "endo-hyperprolactinemia",
    shelf: "endocrine",
    title: "Гiperprolactinemia",
    summary:
      "Elevated prolactin → amenorrhea, galactorrhea, infertility; exclude pregnancy, hypothyroidism, medications; macroprolactin assay; pituitary MRI if persistent elevation.",
    clinicalPearl:
      "TSH first with prolactin; stress/fingerstick can falsely elevate — repeat fasting, no breast stimulation.",
    excerpt:
      "Hyperprolactinemia evaluation excludes secondary causes before imaging for prolactinoma.",
    tier: 1,
    source: { label: "Endocrine Society prolactin guideline", organization: "Endocrine Society", year: 2022 },
    tags: ["prolactin", "пролактин", "prolactinoma", "galactorrhea", "amenorrhea"],
  },
  {
    id: "endo-hypothyroid-pregnancy",
    shelf: "endocrine",
    title: "Гипотиреоз · беременность",
    summary:
      "Overt hypothyroidism in pregnancy — treat with levothyroxine (TSH targets per trimester per local protocol); untreated associated with miscarriage, preeclampsia, impaired neurodevelopment.",
    clinicalPearl:
      "Increase levothyroxine dose ~30% early pregnancy; recheck TSH every 4 weeks; US thyroid if nodule palpable.",
    excerpt:
      "Maternal hypothyroidism requires levothyroxine adjustment throughout pregnancy with trimester-specific TSH targets.",
    tier: 1,
    source: { label: "ATA pregnancy thyroid guidelines", organization: "ATA", year: 2022 },
    tags: ["hypothyroid", "гипотиреоз", "TSH", "беременность", "levothyroxine"],
    relatedLinks: [{ label: "TI-RADS", href: "/calculators/ti-rads" }],
  },
  {
    id: "endo-hyperthyroid-pregnancy",
    shelf: "endocrine",
    title: "Тиреotoxicosis · беременность",
    summary:
      "First trimester: gestational transient thyrotoxicosis (hCG-mediated) vs Graves; second/third — Graves more likely; treatment PTU first trimester, switch to CMZ; avoid radioiodine.",
    clinicalPearl:
      "TRAb helps distinguish Graves; thyroid US — vascularity pattern adjunct; fetal monitoring in Graves.",
    excerpt:
      "Thyrotoxicosis in pregnancy requires differentiation of gestational transient hyperthyroidism from Graves disease.",
    tier: 1,
    source: { label: "ATA hyperthyroidism in pregnancy", organization: "ATA", year: 2022 },
    tags: ["hyperthyroid", "Graves", "hCG", "тиреotoxicosis", "TRAb"],
    relatedLinks: [{ label: "TI-RADS", href: "/calculators/ti-rads" }],
  },
  {
    id: "endo-subclinical-hypothyroid",
    shelf: "endocrine",
    title: "Subclinical hypothyroidism · TTC/беременность",
    summary:
      "TSH above trimester reference with normal fT4 — treat especially if TPO positive, IVF, or history of loss per ATA/ local КР; target lower TSH in first trimester.",
    clinicalPearl:
      "TPO antibodies alone increase miscarriage risk — consider levothyroxine even if TSH borderline.",
    excerpt:
      "Subclinical hypothyroidism in pregnancy and preconception is treated based on TSH, antibodies, and history.",
    tier: 1,
    source: { label: "ATA / RCOG thyroid in pregnancy", organization: "ATA · RCOG", year: 2022 },
    tags: ["subclinical", "TPO", "TSH", "TTC", "miscarriage"],
  },
  {
    id: "endo-postpartum-thyroiditis",
    shelf: "endocrine",
    title: "Postpartum thyroiditis",
    summary:
      "Thyrotoxic phase 1–6 months postpartum then hypothyroid — often self-limited; β-blockers for symptoms; monitor TSH; 20% permanent hypothyroidism.",
    clinicalPearl:
      "Differentiate from Graves postpartum — low uptake on scan if performed; TPO usually positive.",
    excerpt:
      "Postpartum thyroiditis presents with a thyrotoxic phase followed by possible hypothyroidism requiring monitoring.",
    tier: 1,
    source: { label: "ATA postpartum thyroiditis", organization: "ATA", year: 2022 },
    tags: ["postpartum", "thyroiditis", "послеродовой", "TPO"],
  },
  {
    id: "endo-pcos-metformin",
    shelf: "endocrine",
    title: "СПКЯ · metformin / IR",
    summary:
      "Metformin improves insulin resistance in PCOS; aids weight/metabolic profile; ovulation induction adjunct; continue through early pregnancy only if protocol indicates for GDM prevention (debated).",
    clinicalPearl:
      "Lifestyle first-line; metformin GI side effects — slow titration; B12 long-term monitoring.",
    excerpt:
      "Metformin is used in PCOS for metabolic improvement and as an adjunct to ovulation induction.",
    tier: 1,
    source: { label: "ESHRE PCOS management", organization: "ESHRE", year: 2023 },
    tags: ["metformin", "insulin resistance", "IR", "СПКЯ", "ожирение"],
  },
  {
    id: "endo-letrozole-ovulation",
    shelf: "endocrine",
    title: "Letrozole · индукция овуляции",
    summary:
      "Letrozole first-line for PCOS ovulation induction vs clomiphene (improved live birth in trials); 2.5–7.5 mg days 2–5; monitor follicles US to prevent multifetal.",
    clinicalPearl:
      "Document endometrial thickness and leading follicle count; cancel cycle if ≥3 mature follicles.",
    excerpt:
      "Letrozole is preferred first-line ovulation induction for anovulatory PCOS in many guidelines.",
    tier: 1,
    source: { label: "ASRM ovulation induction PCOS", organization: "ASRM", year: 2023 },
    tags: ["letrozole", "ovulation", "clomiphene", "индукция", "PCOS"],
  },
  {
    id: "endo-tirads-overview",
    shelf: "endocrine",
    title: "TI-RADS · узлы щитовидной",
    summary:
      "ACR TI-RADS points system (composition, echogenicity, shape, margin, echogenic foci) → TR1–TR5; FNA thresholds size-dependent; pregnancy — same principles with radiation-free US-only triage.",
    clinicalPearl:
      "Taller-than-wide and punctate echogenic foci increase points; use calculator for consistent reporting.",
    excerpt:
      "TI-RADS standardizes thyroid nodule ultrasound risk stratification and FNA recommendations.",
    tier: 1,
    source: { label: "ACR TI-RADS", organization: "ACR", year: 2017 },
    tags: ["TI-RADS", "thyroid nodule", "узел", "щитовидная", "FNA"],
    relatedLinks: [
      { label: "Калькулятор TI-RADS", href: "/calculators/ti-rads" },
      { label: "Клинические нормы", href: "/reference" },
    ],
  },
  {
    id: "endo-thyroid-fna",
    shelf: "endocrine",
    title: "FNA · показания TI-RADS",
    summary:
      "FNA recommended when TI-RADS TR5 ≥5 mm, TR4 ≥10–15 mm per table; TR3 larger thresholds; inadequate → repeat or molecular testing per protocol.",
    clinicalPearl:
      "Pregnancy is not contraindication to FNA; defer elective surgery to second trimester if malignant cytology.",
    excerpt:
      "Thyroid nodule fine-needle aspiration follows TI-RADS size and category thresholds.",
    tier: 1,
    source: { label: "ACR TI-RADS FNA recommendations", organization: "ACR", year: 2017 },
    tags: ["FNA", "ТАБ", "biopsy", "thyroid", "TR5"],
    relatedLinks: [{ label: "TI-RADS", href: "/calculators/ti-rads" }],
  },
  {
    id: "endo-hirsutism-workup",
    shelf: "endocrine",
    title: "Гирсutism · обследование",
    summary:
      "Ferriman-Gallwey score; total/free testosterone, DHEAS, 17-OHP (CAH screen), prolactin, TSH; ovarian/adrenal imaging if tumor suspected; PCOS most common cause.",
    clinicalPearl:
      "Sudden virilization + rapid progression — adrenal/or ovarian tumor until proven otherwise.",
    excerpt:
      "Hirsutism evaluation excludes androgen-secreting tumors and non-PCOS endocrine causes.",
    tier: 1,
    source: { label: "Endocrine Society hirsutism guideline", organization: "Endocrine Society", year: 2018 },
    tags: ["hirsutism", "гирсutism", "testosterone", "DHEAS", "17-OHP"],
  },
  {
    id: "endo-cah-late-onset",
    shelf: "endocrine",
    title: "НКАР · late-onset CAH",
    summary:
      "Nonclassic CAH (21-hydroxylase): elevated 17-OHP, anovulation, hyperandrogenism mimicking PCOS; screen 17-OHP in atypical PCOS or high-risk ethnicity.",
    clinicalPearl:
      "Basal 17-OHP may be normal — ACTH stimulation test if suspicion; glucocorticoids restore fertility in classic cases.",
    excerpt:
      "Late-onset congenital adrenal hyperplasia should be excluded in hyperandrogenic anovulatory women.",
    tier: 2,
    source: { label: "Endocrine Society CAH guideline", organization: "Endocrine Society", year: 2020 },
    tags: ["CAH", "НКАР", "17-OHP", "adrenal", "hyperandrogenism"],
  },
];
