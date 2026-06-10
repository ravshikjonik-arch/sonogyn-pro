import type { EvidenceEntry } from "../types";

/** Дополнения полки surgery — эндометриоз, ERAS, маршруты. */
export const SURGERY_ADDITIONAL_EVIDENCE: EvidenceEntry[] = [
  {
    id: "surg-deep-endo-bowel",
    shelf: "surgery",
    title: "Deep endo · bowel surgery",
    summary:
      "Bowel DIE: segmental resection vs shaving/disc by depth and symptoms; mandatory multidisciplinary team; pre-op MRI + colonoscopy if obstructive symptoms.",
    clinicalPearl:
      "US: hypoechoic bowel wall thickening fixed to uterus — flag for colorectal surgeon pre-op.",
    excerpt:
      "Deep intestinal endometriosis requires multidisciplinary surgical planning.",
    tier: 1,
    source: { label: "ESGE/ESHRE endometriosis surgery", organization: "ESHRE", year: 2023 },
    tags: ["bowel", "DIE", "rectum", "shaving", "resection"],
    relatedLinks: [{ label: "IDEA", href: "/idea-deep-endometriosis" }],
  },
  {
    id: "surg-ureter-endo",
    shelf: "surgery",
    title: "Endo · ureter involvement",
    summary:
      "Ureteric endometriosis causes silent hydronephrosis; pre-op renal US/MRI; stent or resection per urology-gynecology joint plan.",
    clinicalPearl:
      "Lateral deep nodules at uterosacral ligament — assess ureter trajectory on US/MRI.",
    excerpt:
      "Ureteric endometriosis requires imaging of the urinary tract before pelvic surgery.",
    tier: 1,
    source: { label: "ESHRE urinary endometriosis", organization: "ESHRE", year: 2023 },
    tags: ["ureter", "hydronephrosis", "DIE", "kidney"],
  },
  {
    id: "surg-eras-gyn",
    shelf: "surgery",
    title: "ERAS · enhanced recovery",
    summary:
      "Enhanced recovery after gynecologic surgery: pre-op counseling, carbohydrate loading, multimodal analgesia, early mobilization, reduced fasting — ↓ length of stay without ↑ complications.",
    clinicalPearl:
      "US not part of ERAS but pre-op anemia and bowel prep status affect day-of planning.",
    excerpt:
      "ERAS protocols improve recovery after major gynecologic surgery.",
    tier: 1,
    source: { label: "ERAS Society gynecologic guidelines", organization: "ERAS", year: 2023 },
    tags: ["ERAS", "recovery", "laparoscopy", "hysterectomy"],
  },
  {
    id: "surg-vaginal-vs-lap-hyst",
    shelf: "surgery",
    title: "Vaginal vs lap hysterectomy",
    summary:
      "Vaginal route preferred when feasible (least invasive); laparoscopic for enlarged uterus/adnexal disease; abdominal when massive fibroids or severe adhesions.",
    clinicalPearl:
      "Pre-op US uterus volume, mobility, adnexal masses — determines route; document consent for possible conversion.",
    excerpt:
      "Hysterectomy route selection follows uterine size, mobility, and associated pathology.",
    tier: 1,
    source: { label: "NICE / ACOG hysterectomy route", organization: "NICE · ACOG", year: 2022 },
    tags: ["vaginal", "lap hysterectomy", "route", "hysterectomy"],
    relatedLinks: [{ label: "FIGO", href: "/calculators/figo" }],
  },
  {
    id: "surg-tubal-infertility",
    shelf: "surgery",
    title: "Tubal surgery · infertility",
    summary:
      "Tubal factor: hydrosalpinx — salpingectomy or clipping before IVF improves outcomes; tubal anastomosis only selected distal occlusion with skilled surgeon.",
    clinicalPearl:
      "US hydrosalpinx classic — document before IVF cycle; bilateral hydrosalpinx worse prognosis.",
    excerpt:
      "Hydrosalpinges are treated surgically before IVF to improve implantation rates.",
    tier: 1,
    source: { label: "ASRM tubal factor infertility", organization: "ASRM", year: 2023 },
    tags: ["hydrosalpinx", "IVF", "tubal", "salpingectomy", "infertility"],
  },
  {
    id: "surg-ovarian-remnant",
    shelf: "surgery",
    title: "Ovarian remnant syndrome",
    summary:
      "Residual ovarian tissue after oophorectomy causes cyclic pain; US may show small adnexal mass; surgical excision after hormonal suppression trial; high adhesion risk.",
    clinicalPearl:
      "History prior multiple pelvic surgeries — consider remnant vs endometriosis recurrence.",
    excerpt:
      "Ovarian remnant syndrome presents with cyclic pain after oophorectomy and may require reoperation.",
    tier: 2,
    source: { label: "ACOG chronic pelvic pain", organization: "ACOG", year: 2021 },
    tags: ["ovarian remnant", "post-op", "cyclic pain", "adnexal"],
  },
  {
    id: "surg-adhesions-postop",
    shelf: "surgery",
    title: "Adhesions · post-surgery",
    summary:
      "Adhesions cause pain, bowel obstruction, infertility; US limited — MRI/history; adhesion barriers and gentle technique reduce recurrence; reoperation high risk.",
    clinicalPearl:
      "Fixed immobile ovary on US post-surgery suggests adnexal adhesions — correlate with pain.",
    excerpt:
      "Postoperative adhesions contribute to chronic pelvic pain and infertility after pelvic surgery.",
    tier: 2,
    source: { label: "ESHRE adhesions in surgery", organization: "ESHRE", year: 2023 },
    tags: ["adhesions", "спайки", "post-op", "pain"],
  },
  {
    id: "surg-trachelectomy-fertility",
    shelf: "surgery",
    title: "Trachelectomy · fertility sparing",
    summary:
      "Radical trachelectomy for early cervical cancer (IA2–IB1 selected) preserves fertility; pre-op MRI staging; cerclage in pregnancy; specialized center mandatory.",
    clinicalPearl:
      "Not for adenocarcinoma all stages — strict histology/size criteria; post-op CL surveillance in pregnancy.",
    excerpt:
      "Radical trachelectomy offers fertility-preserving treatment for selected early cervical cancers.",
    tier: 1,
    source: { label: "FIGO / ESGO cervical cancer fertility", organization: "FIGO · ESGO", year: 2022 },
    tags: ["trachelectomy", "cervical cancer", "fertility", "cerclage"],
    relatedLinks: [{ label: "Калькулятор CL", href: "/calculators/cervical-length" }],
  },
  {
    id: "surg-vault-prolapse",
    shelf: "surgery",
    title: "Post-hysterectomy vault prolapse",
    summary:
      "Apical prolapse after hysterectomy — sacrocolpopexy or vaginal vault suspension; pre-op POP-Q; exclude enterocele on imaging/clinical exam.",
    clinicalPearl:
      "Cuff dehiscence rare post-lap — acute pain/bleeding emergency vs gradual prolapse.",
    excerpt:
      "Vault prolapse after hysterectomy requires apical compartment surgical support.",
    tier: 1,
    source: { label: "ICS prolapse surgery", organization: "ICS", year: 2023 },
    tags: ["vault", "prolapse", "post-hysterectomy", "sacrocolpopexy"],
    relatedLinks: [{ label: "POP-Q", href: "/calculators/pop-q" }],
  },
  {
    id: "surg-bladder-injury-risk",
    shelf: "surgery",
    title: "Bladder injury · risk at lap",
    summary:
      "Bladder injury risk ↑ with anteverted uterus adhesions, endometriosis, prior cesarean; cystoscopy at end of case if suspected; pre-op full bladder US identifies bladder line (optional).",
    clinicalPearl:
      "Anticipate bladder endometriosis nodules on pre-op US — adjust dissection plane.",
    excerpt:
      "Bladder injury prevention in pelvic surgery relies on anatomy recognition and cystoscopic confirmation when needed.",
    tier: 1,
    source: { label: "ACOG / ESHRE surgical complications", organization: "ACOG", year: 2022 },
    tags: ["bladder", "injury", "cystoscopy", "complication", "endometriosis"],
  },
  {
    id: "surg-sis-preop",
    shelf: "surgery",
    title: "SIS · preoperative mapping",
    summary:
      "Saline infusion sonography defines submucous fibroid percentage intracavitary, polyps, septum — guides hysteroscopic vs lap myomectomy approach.",
    clinicalPearl:
      "Perform when endometrium thin (early follicular); document % intracavitary protrusion for FIGO 2–5.",
    excerpt:
      "Sonohysterography maps intrauterine pathology before minimally invasive surgery.",
    tier: 1,
    source: { label: "ISUOG sonohysterography guideline", organization: "ISUOG", year: 2022 },
    tags: ["SIS", "sonohysterography", "submucous", "pre-op"],
    relatedLinks: [
      { label: "FIGO", href: "/calculators/figo" },
      { label: "Срез матки 3D", href: "/uterus-3d" },
    ],
  },
  {
    id: "surg-myomectomy-pregnancy",
    shelf: "surgery",
    title: "Post-myomectomy · pregnancy",
    summary:
      "Pregnancy after myomectomy: uterine rupture risk depends on entry type and depth; many centers offer cesarean for transmural/multiple myomectomies; US monitors scar area.",
    clinicalPearl:
      "Counsel before myomectomy on delivery mode; document operative report details for obstetric team.",
    excerpt:
      "Delivery planning after myomectomy considers uterine wall integrity and fibroid entry.",
    tier: 1,
    source: { label: "RCOG fibroids in pregnancy", organization: "RCOG", year: 2022 },
    tags: ["myomectomy", "pregnancy", "rupture", "cesarean", "scar"],
  },
  {
    id: "surg-dvt-prophylaxis",
    shelf: "surgery",
    title: "VTE prophylaxis · gyn surgery",
    summary:
      "Caprini score guides mechanical/pharmacologic VTE prophylaxis for lap and open pelvic surgery; extended prophylaxis in cancer surgery per protocol.",
    clinicalPearl:
      "Obesity, malignancy, long operative time — document risk score in pre-op checklist.",
    excerpt:
      "Venous thromboembolism prophylaxis is recommended for major gynecologic procedures per risk assessment.",
    tier: 1,
    source: { label: "ACOG VTE prophylaxis", organization: "ACOG", year: 2022 },
    tags: ["VTE", "DVT", "prophylaxis", "Caprini", "surgery"],
  },
  {
    id: "surg-kr-rf-gyn-surgery",
    shelf: "surgery",
    title: "КР РФ · гин. хирургия",
    summary:
      "КР МЗ РФ по миоме, эндометриозу, AUB — показания к organ-sparing vs hysterectomy, laparoscopic access, онкомаршрут; УЗИ — обязательный pre-op этап в амбулатории.",
    clinicalPearl:
      "При расхождении с международными гайдлайнами — протокол учреждения + informed consent.",
    excerpt:
      "Russian clinical guidelines define indications for gynecologic surgery and preoperative imaging.",
    tier: 1,
    source: { label: "КР МЗ РФ · миoma, endometriosis, AUB", organization: "МЗ РФ", year: 2021 },
    tags: ["КР РФ", "хирургия", "Russia", "миома", "эндометриоз"],
    relatedLinks: [{ label: "КР и приказы", href: "/guidelines" }],
  },
  {
    id: "surg-lap-to-open-conversion",
    shelf: "surgery",
    title: "Lap → laparotomy · conversion",
    summary:
      "Convert to laparotomy for uncontrolled bleeding, extensive adhesions, malignancy spill concern, or inadequate exposure — pre-op consent must include conversion risk.",
    clinicalPearl:
      "Large uterus (>12–14 cm) or multiple prior laparotomies — discuss open approach upfront.",
    excerpt:
      "Conversion from laparoscopy to laparotomy is performed when safety or oncologic principles require open access.",
    tier: 2,
    source: { label: "RCOG laparoscopic complications", organization: "RCOG", year: 2024 },
    tags: ["conversion", "laparotomy", "bleeding", "consent"],
  },
];
