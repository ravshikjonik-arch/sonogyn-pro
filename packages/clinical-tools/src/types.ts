/** Профиль врача для пинов и сортировки поиска */
export type DoctorRole = "ultrasound" | "gynecologist" | "obstetrician" | "allied";

export type ToolCategory =
  | "community"
  | "ovary"
  | "uterus"
  | "breast"
  | "thyroid"
  | "lymph"
  | "pregnancy"
  | "pelvic"
  | "assistant"
  | "reference";

/** Идентификатор действия на mobile (см. openClinicalTool) */
export type MobileToolAction =
  | "chat_web"
  | "new_case"
  | "telegram"
  | "elastography"
  | "vascular_carotid"
  | "orads"
  | "orads_flow"
  | "orads_wizard"
  | "orads_guide"
  | "orads_echograms"
  | "orads_hub"
  | "birads"
  | "breast_3d"
  | "tirads"
  | "uterus_clinic"
  | "endometrium"
  | "cervical_length"
  | "popq"
  | "colposcopy"
  | "cin_risk"
  | "cervical_intelligence"
  | "fmf"
  | "ln_rads"
  | "gyn_assistant_gyn"
  | "gyn_assistant_obs"
  | "gyn_hub"
  | "ga_lmp"
  | "ga_us"
  | "ga_crl"
  | "ga_msd"
  | "nosology"
  | "clinical_ref"
  | "guidelines"
  | "medvedev"
  | "evidence_assistant";

export type ClinicalTool = {
  id: string;
  title: string;
  subtitle: string;
  category: ToolCategory;
  roles: DoctorRole[];
  synonyms: string[];
  keywords: string[];
  webHref?: string;
  mobileAction?: MobileToolAction;
};

export type ClinicalToolSearchResult = ClinicalTool & { score: number };
