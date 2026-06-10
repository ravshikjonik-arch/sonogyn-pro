import type { EvidenceEntry } from "../types";

/** Дополнения полки endocrine — беременность, метаболизм, редкие причины. */
export const ENDOCRINE_ADDITIONAL_EVIDENCE: EvidenceEntry[] = [
  {
    id: "endo-hashimoto-pregnancy",
    shelf: "endocrine",
    title: "Hashimoto · TPO+ pregnancy",
    summary:
      "TPO antibodies increase risk of miscarriage, postpartum thyroiditis, and need for levothyroxine even when euthyroid — treat per ATA when TSH above trimester-specific upper limit.",
    clinicalPearl:
      "US: heterogeneous thyroid typical; monitor TSH each trimester; postpartum thyroid function at 6–12 weeks.",
    excerpt:
      "Thyroid autoimmunity in pregnancy influences monitoring frequency and levothyroxine treatment thresholds.",
    tier: 1,
    source: { label: "ATA pregnancy thyroid disease", organization: "ATA", year: 2022 },
    tags: ["Hashimoto", "TPO", "autoimmune", "thyroid", "беременность"],
    relatedLinks: [{ label: "TI-RADS", href: "/calculators/ti-rads" }],
  },
  {
    id: "endo-gdm-endocrine-link",
    shelf: "endocrine",
    title: "GDM · эндокринный контекст",
    summary:
      "GDM reflects pregnancy metabolic stress; PCOS and obesity increase risk; postpartum OGTT at 4–12 weeks screens for persistent diabetes; lifestyle + insulin/metformin per protocol.",
    clinicalPearl:
      "Document prior PCOS/GDM in chart; fetal US macrosomia/polyhydramnios prompts glucose review.",
    excerpt:
      "Gestational diabetes requires postpartum screening for type 2 diabetes and long-term metabolic follow-up.",
    tier: 1,
    source: { label: "ADA / WHO GDM standards", organization: "ADA · WHO", year: 2022 },
    tags: ["GDM", "ГСД", "diabetes", "postpartum OGTT", "PCOS"],
    relatedLinks: [{ label: "FMF · GDM", href: "/assistant/fmf" }],
  },
  {
    id: "endo-turner-amh",
    shelf: "endocrine",
    title: "Turner syndrome · fertility",
    summary:
      "Turner (45,X): streak gonads, very low AMH, POI; cardiology workup before pregnancy; oocyte donation often required; mosaicism affects prognosis.",
    clinicalPearl:
      "Renal/US neck screening in Turner; do not assume «normal AMH» excludes mosaic POI without karyotype.",
    excerpt:
      "Turner syndrome is associated with premature ovarian insufficiency and specialized reproductive counseling.",
    tier: 1,
    source: { label: "ESHRE Turner guideline", organization: "ESHRE", year: 2024 },
    tags: ["Turner", "45X", "mosaic", "streak gonad", "AMH"],
  },
  {
    id: "endo-hypogonadotropic",
    shelf: "endocrine",
    title: "Hypogonadotropic amenorrhea",
    summary:
      "Low FSH/LH with low estradiol — functional (stress, weight loss, exercise), pituitary tumor, Kallmann; MRI pituitary if prolactin normal and no obvious functional cause.",
    clinicalPearl:
      "Eating disorder/reduced energy availability common — restore weight before gonadotropin therapy.",
    excerpt:
      "Hypogonadotropic hypogonadism requires pituitary imaging and evaluation for functional causes.",
    tier: 1,
    source: { label: "Endocrine Society hypogonadism guideline", organization: "Endocrine Society", year: 2020 },
    tags: ["hypogonadotropic", "FSH", "LH", "amenorrhea", "pituitary"],
  },
  {
    id: "endo-thyroid-cancer-pregnancy",
    shelf: "endocrine",
    title: "Рак щитовидной · беременность",
    summary:
      "Differentiated thyroid cancer — usually defer surgery to postpartum if low risk; if operated second trimester preferred; TSH suppression targets modified in pregnancy.",
    clinicalPearl:
      "US surveillance of known nodule in pregnancy; FNA if growth; avoid radioactive iodine absolutely.",
    excerpt:
      "Thyroid cancer management in pregnancy balances maternal treatment delay with tumor biology.",
    tier: 1,
    source: { label: "ATA thyroid cancer pregnancy", organization: "ATA", year: 2022 },
    tags: ["thyroid cancer", "PTC", "беременность", "surgery", "TSH suppression"],
    relatedLinks: [{ label: "TI-RADS", href: "/calculators/ti-rads" }],
  },
  {
    id: "endo-ovarian-hyperthecosis",
    shelf: "endocrine",
    title: "Ovarian hyperthecosis",
    summary:
      "Severe hyperandrogenism and insulin resistance in postmenopausal/perimenopausal women; solid ovarian stroma on US; exclude androgen-secreting tumor; treat IR and androgen excess.",
    clinicalPearl:
      "Postmenopausal virilization — DHEAS/testosterone + adrenal CT + ovarian US mandatory.",
    excerpt:
      "Ovarian hyperthecosis causes marked hyperandrogenism and requires exclusion of ovarian neoplasms.",
    tier: 2,
    source: { label: "Endocrine Society androgen excess", organization: "Endocrine Society", year: 2018 },
    tags: ["hyperthecosis", "androgen", "postmenopause", "stroma"],
  },
  {
    id: "endo-vitamin-d-pcos",
    shelf: "endocrine",
    title: "Vitamin D · PCOS",
    summary:
      "Vitamin D deficiency common in PCOS; supplementation if deficient may modestly improve metabolic markers — not standalone fertility treatment.",
    clinicalPearl:
      "Check 25-OH-D with metabolic panel in PCOS; correct deficiency per endocrine norms.",
    excerpt:
      "Vitamin D supplementation is recommended in PCOS when deficiency is documented.",
    tier: 2,
    source: { label: "ESHRE PCOS lifestyle", organization: "ESHRE", year: 2023 },
    tags: ["vitamin D", "PCOS", "deficiency", "metabolic"],
  },
  {
    id: "endo-menopause-hrt-basics",
    shelf: "endocrine",
    title: "Мenopause · HRT basics",
    summary:
      "HRT indicated for vasomotor symptoms in healthy <60 or within 10 years of menopause; transdermal estrogen preferred in obesity/VTE risk; progestogen if uterus present.",
    clinicalPearl:
      "TVUS endometrial thickness monitoring if unscheduled bleeding on HRT — biopsy per protocol.",
    excerpt:
      "Menopausal hormone therapy follows age, symptom, and risk-stratified guidelines.",
    tier: 1,
    source: { label: "NICE / ESHRE menopause guideline", organization: "NICE · ESHRE", year: 2024 },
    tags: ["menopause", "HRT", "климакс", "эстроген", "progestogen"],
    relatedLinks: [{ label: "Калькулятор эндометрия", href: "/calculators/endometrium" }],
  },
  {
    id: "endo-thyroid-us-pregnancy",
    shelf: "endocrine",
    title: "УЗИ щитовидной · беременность",
    summary:
      "US safe throughout pregnancy for palpable nodule, compressive symptoms, or abnormal exam; TI-RADS applies; avoid unnecessary repeat if stable low-risk nodule documented pre-pregnancy.",
    clinicalPearl:
      "Increased thyroid volume/hyperemia normal in pregnancy — do not overcall «thyroiditis» without labs.",
    excerpt:
      "Thyroid ultrasound is the primary imaging for thyroid nodules during pregnancy.",
    tier: 1,
    source: { label: "ATA pregnancy nodule management", organization: "ATA", year: 2022 },
    tags: ["thyroid US", "беременность", "узел", "щитовидная"],
    relatedLinks: [{ label: "TI-RADS", href: "/calculators/ti-rads" }],
  },
  {
    id: "endo-weight-pcos-fertility",
    shelf: "endocrine",
    title: "Weight · PCOS fertility",
    summary:
      "5–10% weight loss in overweight PCOS restores ovulation in subset; first-line before pharmacologic induction; bariatric surgery — delay pregnancy 12–18 months post-op.",
    clinicalPearl:
      "Document BMI and waist; combined lifestyle + letrozole superior to either alone in many cohorts.",
    excerpt:
      "Lifestyle weight management is first-line therapy for anovulatory PCOS with obesity.",
    tier: 1,
    source: { label: "ESHRE PCOS fertility", organization: "ESHRE", year: 2023 },
    tags: ["weight", "BMI", "lifestyle", "PCOS", "ovulation"],
  },
  {
    id: "endo-androgen-tumor-red-flags",
    shelf: "endocrine",
    title: "Androgen-secreting tumor · red flags",
    summary:
      "Virilization (clitoromegaly, temporal balding, voice change), very high testosterone/DHEAS, rapid onset — ovarian or adrenal imaging urgent; not PCOS phenotype.",
    clinicalPearl:
      "Tumor testosterone often >200 ng/dL; US ovary + adrenal CT/MRI; consult oncology/endocrine.",
    excerpt:
      "Rapid severe virilization mandates imaging for androgen-secreting ovarian or adrenal tumors.",
    tier: 1,
    source: { label: "Endocrine Society androgen excess", organization: "Endocrine Society", year: 2018 },
    tags: ["virilization", "tumor", "testosterone", "DHEAS", "red flags"],
    relatedLinks: [{ label: "O-RADS Pro", href: "/calculators/o-rads" }],
  },
  {
    id: "endo-pcos-adolescent",
    shelf: "endocrine",
    title: "СПКЯ · подростки",
    summary:
      "In adolescents within 8 years of menarche — hyperandrogenism + irregular cycles may be physiologic; PCOM alone insufficient; focus on lifestyle, avoid premature «PCOS label» without persistence.",
    clinicalPearl:
      "Document cycle length chart 3–6 months; re-evaluate after pubertal maturation.",
    excerpt:
      "PCOS diagnosis in adolescents requires careful exclusion of normal pubertal variation.",
    tier: 1,
    source: { label: "ESHRE/ICPADR adolescent PCOS", organization: "ESHRE", year: 2023 },
    tags: ["adolescent", "подросток", "PCOS", "puberty", "cycles"],
  },
  {
    id: "endo-thyroid-screening-pregnancy",
    shelf: "endocrine",
    title: "TSH screening · беременность",
    summary:
      "Universal vs risk-based TSH screening debated; ATA recommends testing high-risk (thyroid disease history, TPO+, symptoms, type 1 diabetes); treat to trimester TSH targets.",
    clinicalPearl:
      "First prenatal visit — TSH if any risk factor; sync with regional КР РФ antenatal panel.",
    excerpt:
      "Thyroid function testing in pregnancy targets women at increased risk and those with abnormal symptoms.",
    tier: 1,
    source: { label: "ATA / КР РФ antenatal care", organization: "ATA · МЗ РФ", year: 2022 },
    tags: ["TSH screening", "беременность", "antenatal", "КР РФ"],
    relatedLinks: [{ label: "КР и приказы", href: "/guidelines" }],
  },
  {
    id: "endo-insulin-resistance-pcos",
    shelf: "endocrine",
    title: "Insulin resistance · PCOS",
    summary:
      "HOMA-IR, fasting glucose, HbA1c screen PCOS metabolic risk; metformin + lifestyle reduce progression to T2DM; OGTT before fertility treatment if obese.",
    clinicalPearl:
      "Normal BMI PCOS can still have IR — metabolic panel not only for obese patients.",
    excerpt:
      "Insulin resistance screening is part of comprehensive PCOS metabolic assessment.",
    tier: 1,
    source: { label: "ESHRE PCOS metabolic", organization: "ESHRE", year: 2023 },
    tags: ["insulin", "HOMA", "HbA1c", "metabolic", "PCOS"],
  },
  {
    id: "endo-kr-rf-endocrine",
    shelf: "endocrine",
    title: "КР РФ · эндокринология гин.",
    summary:
      "КР МЗ РФ по СПКЯ, бесплодию, щитовидной патологии в беременности — маршрутизация к эндокринологу, целевые уровни TSH, скрининг GDM; УЗИ — первичная визуализация яичников и щитовидной.",
    clinicalPearl:
      "Сверяйте приказы ДЗМ/региона с международными ATA/ESHRE — документируйте при расхождении.",
    excerpt:
      "Russian guidelines integrate endocrine and obstetric care for PCOS, infertility, and thyroid disease.",
    tier: 1,
    source: { label: "КР МЗ РФ · СПКЯ, бесплодие, щитовидная", organization: "МЗ РФ", year: 2021 },
    tags: ["КР РФ", "Russia", "СПКЯ", "щитовидная", "бесплодие"],
    relatedLinks: [{ label: "КР и приказы", href: "/guidelines" }],
  },
];
