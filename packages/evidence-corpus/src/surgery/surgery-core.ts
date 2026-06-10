import type { EvidenceEntry } from "../types";

/** Ядро полки «Хирургия · тазовая» — показания, pre-op УЗИ, lap/hyst. */
export const SURGERY_CORE_EVIDENCE: EvidenceEntry[] = [
  {
    id: "surg-lap-indications",
    shelf: "surgery",
    title: "Laparoscopy · показания",
    summary:
      "Diagnostic/operative laparoscopy for unexplained pelvic pain, infertility workup, endometriosis, adnexal mass, ectopic pregnancy, sterilization — TVUS pre-op maps adnexa and DIE.",
    clinicalPearl:
      "Document sliding sign, deep nodules, hydrosalpinx before OR — improves consent and surgical planning.",
    excerpt:
      "Gynecologic laparoscopy indications include adnexal pathology, endometriosis, and infertility evaluation.",
    tier: 1,
    source: { label: "RCOG laparoscopy guideline", organization: "RCOG", year: 2024 },
    tags: ["laparoscopy", "лаparoscopy", "показания", "ДЭ", "adnexal"],
    relatedLinks: [{ label: "IDEA · эндометриоз", href: "/idea-deep-endometriosis" }],
  },
  {
    id: "surg-hysteroscopy-indications",
    shelf: "surgery",
    title: "Hysteroscopy · показания",
    summary:
      "Diagnostic/operative hysteroscopy: abnormal uterine bleeding, submucous myoma/polyp, intrauterine adhesions, retained products, infertility cavity assessment.",
    clinicalPearl:
      "SIS/3D TVUS before hysteroscopy for submucous FIGO typing; endometrial biopsy if malignancy risk.",
    excerpt:
      "Hysteroscopy is the standard for intrauterine pathology evaluation and treatment.",
    tier: 1,
    source: { label: "ESHRE hysteroscopy guideline", organization: "ESHRE", year: 2023 },
    tags: ["hysteroscopy", "гистероскопия", "полип", "submucous", "AUB"],
    relatedLinks: [{ label: "Калькулятор FIGO", href: "/calculators/figo" }],
  },
  {
    id: "surg-myomectomy-vs-hysterectomy",
    shelf: "surgery",
    title: "Myomectomy vs hysterectomy",
    summary:
      "Myomectomy preserves fertility for symptomatic fibroids in women desiring pregnancy; hysterectomy definitive for completed fertility or multiple comorbid fibroids — route (lap/vag/abdominal) by size/FIGO.",
    clinicalPearl:
      "Pre-op US: count, FIGO type, endometrial contact; counsel on cesarean after deep myomectomy per local protocol.",
    excerpt:
      "Fibroid surgery choice depends on fertility plans, FIGO classification, and symptom burden.",
    tier: 1,
    source: { label: "FIGO / NICE fibroid management", organization: "FIGO · NICE", year: 2022 },
    tags: ["myomectomy", "hysterectomy", "миома", "FIGO", "fertility"],
    relatedLinks: [
      { label: "FIGO", href: "/calculators/figo" },
      { label: "Срез матки 3D", href: "/uterus-3d" },
    ],
  },
  {
    id: "surg-endo-preop-us",
    shelf: "surgery",
    title: "Endometriosis · pre-op УЗИ",
    summary:
      "Expert TVUS maps endometriomas, deep nodules (bowel, bladder, rectovaginal), adhesions; MRI adjunct for complex DIE before laparoscopy.",
    clinicalPearl:
      "IDEA checklist in report — surgeon needs compartment-specific localization; negative US does not exclude DIE.",
    excerpt:
      "Preoperative ultrasound mapping improves surgical planning for endometriosis.",
    tier: 1,
    source: { label: "IDEA / ISUOG endometriosis surgery", organization: "IDEA · ISUOG", year: 2023 },
    tags: ["endometriosis", "pre-op", "DIE", "mapping", "IDEA"],
    relatedLinks: [{ label: "IDEA workspace", href: "/idea-deep-endometriosis" }],
  },
  {
    id: "surg-adnexal-preop",
    shelf: "surgery",
    title: "Adnexal mass · pre-op triage",
    summary:
      "O-RADS category guides urgency and specialist: O-RADS 2 — elective; 4–5 — gynecologic oncology; pre-op CA-125, CT chest/abdomen/pelvis if malignancy suspected.",
    clinicalPearl:
      "Document O-RADS in referral letter; avoid cystectomy spill in suspected malignancy — oncologic staging first.",
    excerpt:
      "Preoperative adnexal mass evaluation uses O-RADS risk stratification and oncology referral pathways.",
    tier: 1,
    source: { label: "ACR O-RADS / ESGO surgical", organization: "ACR · ESGO", year: 2022 },
    tags: ["adnexal", "pre-op", "O-RADS", "oncology", "surgery"],
    relatedLinks: [{ label: "O-RADS Pro", href: "/calculators/o-rads" }],
  },
  {
    id: "surg-cystectomy-vs-oophorectomy",
    shelf: "surgery",
    title: "Cystectomy vs oophorectomy",
    summary:
      "Premenopausal: ovarian-sparing cystectomy preferred for benign lesions; oophorectomy if suspicious, recurrent endometrioma after fertility complete, or patient choice after counseling on AMH impact.",
    clinicalPearl:
      "Bilateral oophorectomy — premature surgical menopause; document AMH/counseling pre-op if elective.",
    excerpt:
      "Benign adnexal surgery favors ovarian preservation in premenopausal women when safe.",
    tier: 1,
    source: { label: "RCOG ovarian cyst surgery", organization: "RCOG", year: 2022 },
    tags: ["cystectomy", "oophorectomy", "яичник", "AMH", "benign"],
  },
  {
    id: "surg-ectopic-salpingectomy",
    shelf: "surgery",
    title: "Ectopic · salpingectomy vs salpingotomy",
    summary:
      "Hemodynamically stable: salpingectomy preferred (similar fertility with contralateral tube); salpingotomy if single tube or fertility preservation priority with hCG follow-up.",
    clinicalPearl:
      "Pre-op US documents adnexal mass, free fluid; methotrexate if unruptured and criteria met — no surgery.",
    excerpt:
      "Ectopic pregnancy surgery balances tubal preservation with recurrence and persistent trophoblast risk.",
    tier: 1,
    source: { label: "ACOG ectopic pregnancy", organization: "ACOG", year: 2023 },
    tags: ["ectopic", "salpingectomy", "salpingotomy", "methotrexate"],
    relatedLinks: [{ label: "Помощник акушера", href: "/assistant/obstetrics" }],
  },
  {
    id: "surg-cerclage-route",
    shelf: "surgery",
    title: "Cerclage · vaginal vs abdominal",
    summary:
      "Transvaginal cerclage (McDonald/Shirodkar) first-line for cervical insufficiency; abdominal/lap cerclage for failed vaginal or extremely short cervix — cesarean delivery required.",
    clinicalPearl:
      "Pre-op CL history + prior loss timing; exclude infection before elective cerclage.",
    excerpt:
      "Cervical cerclage route depends on prior failure, cervical anatomy, and surgical expertise.",
    tier: 1,
    source: { label: "ISUOG cerclage guideline", organization: "ISUOG", year: 2022 },
    tags: ["cerclage", "McDonald", "abdominal cerclage", "CL"],
    relatedLinks: [{ label: "Калькулятор CL", href: "/calculators/cervical-length" }],
  },
  {
    id: "surg-scar-niche",
    shelf: "surgery",
    title: "Niche · cesarean scar defect",
    summary:
      "CSD on TVUS: wedge defect in anterior lower uterine segment; symptoms AUB, dysmenorrhea, infertility; hysteroscopic or lap repair in selected patients after US/MRI characterization.",
    clinicalPearl:
      "Measure residual myometrium thickness; RMT <3 mm increases rupture risk in subsequent pregnancy — document in counseling.",
    excerpt:
      "Cesarean scar niche diagnosis on ultrasound guides surgical repair decisions.",
    tier: 1,
    source: { label: "ISUOG / JUM niche consensus", organization: "ISUOG", year: 2023 },
    tags: ["niche", "CSD", "cesarean scar", "RMT", "defect"],
    relatedLinks: [{ label: "Срез матки 3D", href: "/uterus-3d" }],
  },
  {
    id: "surg-pop-preop",
    shelf: "surgery",
    title: "POP · pre-op assessment",
    summary:
      "Pelvic organ prolapse staging POP-Q; dynamic US/MRI adjunct; pessary trial optional; surgery by compartment (anterior/posterior/apical) — mesh restrictions per regional regulation.",
    clinicalPearl:
      "Document prolapse stage at rest and Valsalva; bladder emptying function before apical repair.",
    excerpt:
      "Prolapse surgery planning uses POP-Q staging and functional assessment.",
    tier: 1,
    source: { label: "ICS POP-Q / NICE prolapse", organization: "ICS · NICE", year: 2023 },
    tags: ["POP", "prolapse", "POP-Q", "cystocele", "rectocele"],
    relatedLinks: [{ label: "Калькулятор POP-Q", href: "/calculators/pop-q" }],
  },
  {
    id: "surg-hysteroscopic-polypectomy",
    shelf: "surgery",
    title: "Polypectomy · hysteroscopic",
    summary:
      "Endometrial polyp causing AUB or infertility — hysteroscopic polypectomy preferred; send histology; postmenopausal polyp always histology to exclude malignancy.",
    clinicalPearl:
      "SIS identifies polyp stalk and base; avoid blind D&C as sole treatment.",
    excerpt:
      "Hysteroscopic polypectomy is standard treatment for symptomatic endometrial polyps.",
    tier: 1,
    source: { label: "ESHRE polyp guideline", organization: "ESHRE", year: 2023 },
    tags: ["polyp", "polypectomy", "hysteroscopy", "AUB", "infertility"],
    relatedLinks: [{ label: "Калькулятор эндометрия", href: "/calculators/endometrium" }],
  },
  {
    id: "surg-endometrial-ablation",
    shelf: "surgery",
    title: "Endometrial ablation",
    summary:
      "Second-line for AUB without structural pathology after failed medical therapy; contraindicated if future pregnancy desired, hyperplasia, large submucous fibroid; sterilization often required.",
    clinicalPearl:
      "Pre-op SIS/endometrial biopsy mandatory; document cavity size and fibroid exclusion.",
    excerpt:
      "Endometrial ablation treats heavy menstrual bleeding in women completing childbearing.",
    tier: 1,
    source: { label: "NICE heavy menstrual bleeding", organization: "NICE", year: 2021 },
    tags: ["ablation", "абlation", "AUB", "HMB", "endometrium"],
  },
  {
    id: "surg-prophylactic-oophorectomy",
    shelf: "surgery",
    title: "Risk-reducing oophorectomy · BRCA",
    summary:
      "BRCA1/2 carriers: RRSO typically 35–40 (BRCA1) or 40–45 (BRCA2) after family complete; reduces ovarian/tubal cancer; initiates surgical menopause — HRT until natural age unless breast cancer history.",
    clinicalPearl:
      "Pre-op TVUS not screening for occult cancer — surgical pathology includes complete tubal inspection.",
    excerpt:
      "Risk-reducing salpingo-oophorectomy is recommended for BRCA carriers at defined ages.",
    tier: 1,
    source: { label: "NCCN hereditary breast/ovarian cancer", organization: "NCCN", year: 2024 },
    tags: ["BRCA", "RRSO", "prophylactic", "oophorectomy", "risk-reducing"],
  },
  {
    id: "surg-conization-leep",
    shelf: "surgery",
    title: "Conization / LEEP · CIN",
    summary:
      "Excisional treatment CIN2+; LEEP office vs cold knife OR; ECC if type 2/3 TZ; follow-up HPV co-testing post-treatment; pregnancy — ↑ PTB risk after excision.",
    clinicalPearl:
      "Document depth of excision; avoid over-treatment CIN1; colposcopy satisfactory before LEEP.",
    excerpt:
      "Excisional procedures treat cervical intraepithelial neoplasia with structured post-treatment surveillance.",
    tier: 1,
    source: { label: "ASCCP CIN treatment", organization: "ASCCP", year: 2020 },
    tags: ["LEEP", "conization", "CIN", "excision", "cervix"],
    relatedLinks: [{ label: "Нозология · шейка", href: "/nosologies/cervix-pathology" }],
  },
  {
    id: "surg-postop-us",
    shelf: "surgery",
    title: "Post-op УЗИ · осложнения",
    summary:
      "Postoperative TVUS: hematoma, abscess, retained fluid, urinoma after pelvic surgery; acute pain/fever — US first; differentiate ileus from abscess clinically.",
    clinicalPearl:
      "Complex adnexal mass post-myomectomy — distinguish hematoma vs abscess; Doppler helps.",
    excerpt:
      "Ultrasound evaluates postoperative pelvic collections and complications after gynecologic surgery.",
    tier: 2,
    source: { label: "RCOG postoperative care", organization: "RCOG", year: 2023 },
    tags: ["post-op", "hematoma", "abscess", "complication", "УЗИ"],
  },
];
