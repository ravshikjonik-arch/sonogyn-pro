export const FETAL_ANATOMY_SURVEY_ALGORITHM = {
  id: "22-view-survey",
  title: "Систематический протокол 22 срезов",
  steps: [
    { order: 1, phase: "Overview", views: ["overview-1"], action: "Longitudinal orientation, viability" },
    { order: 2, phase: "Spine", views: ["view-01-spine-sagittal", "view-02-spine-coronal", "view-03-trunk-coronal"], action: "Skin line, coronal spine, trunk situs" },
    { order: 3, phase: "Brain", views: ["view-04-transventricular", "view-05-transthalamic", "view-06-transcerebellar"], action: "Ventricles, CSP/thalami, cerebellum" },
    { order: 4, phase: "Heart", views: ["view-07a-apical-four-chamber", "view-07b-lateral-four-chamber", "view-08-lvot", "view-09-rvot", "view-09b-crossing-outflow", "view-10-three-vessel-trachea"], action: "Full cardiac chain ending 3VT" },
    { order: 5, phase: "Abdomen", views: ["view-11-umbilical-vein", "view-12-cord-insertion", "view-13-kidneys"], action: "UV, insertion, kidneys bilateral" },
    { order: 6, phase: "Pelvis", views: ["view-14-bladder-arteries"], action: "Bladder + 2 arteries" },
    { order: 7, phase: "Limbs", views: ["view-15-femur", "view-16-lower-limbs", "view-17-upper-limbs"], action: "Femur length, legs, arms" },
    { order: 8, phase: "Face", views: ["view-18-upper-lip", "view-19-orbits", "view-20-profile"], action: "Lip, orbits, profile" },
    { order: 9, phase: "Whole body", views: ["overview-2"], action: "Neck to sacrum sweep — do not skip" },
  ],
} as const;

export const FETAL_ANATOMY_INTRODUCTION = {
  whySystematicScan: [
    "65 ВПР требуют структурированного прохода — один пропущенный срез = missed diagnosis.",
    "Протокол Емельяненко привязан к II триместру (18–22 нед) и audit-ready документированию.",
  ],
  screeningVsDiagnostic: [
    "Screening — исключить major anomalies в стандартном наборе срезов.",
    "Diagnostic — targeted views при находке + expert echo/MRI/genetics.",
  ],
  secondTrimesterRole: [
    "Optimal window для biometry, organ morphology, cardiac outflow, limbs/face.",
    "Связка с FMF II скринингом и ISUOG basic training.",
  ],
  commonPitfalls: [
    "Остановка на 4CV без LVOT/RVOT/3VT.",
    "Пустой bladder → ложный 'no SUA'.",
    "Пропуск overview-2.",
    "Oblique brain planes → false ventriculomegaly.",
  ],
} as const;

export const FETAL_ANATOMY_LEMON_SIGN_ALGORITHM = {
  id: "lemon-banana-workup",
  title: "Lemon / banana sign → spine protocol",
  steps: [
    { step: 1, action: "Do not close scan — document lemon on views 4–5" },
    { step: 2, action: "Obtain view 1 sagittal spine — skin line continuous?" },
    { step: 3, action: "View 2 coronal spine — posterior elements" },
    { step: 4, action: "View 6 banana sign — Chiari II marker" },
    { step: 5, action: "Overview-2 transverse sweep neck → sacrum" },
    { step: 6, action: "Genetics / MRI spine discussion per protocol" },
  ],
} as const;
