import type { NavigatorScreenParams } from "@react-navigation/native";

export type MainTabParamList = {
  ChatTab: { section?: "discussions" | "local" | "gallery" } | undefined;
  ToolsTab: undefined;
  AssistantTab: undefined;
  KnowledgeTab: { section?: "guidelines" | "library" } | undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Landing: undefined;
  Splash: undefined;
  Blocked: undefined;
  Consent: undefined;
  TermsOfUse: undefined;
  PrivacyPolicy: undefined;
  MedicalDisclaimer: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  Case:
    | {
        caseId?: string;
        /** Открыть мастер сразу на шаге загрузки снимка (новый кейс). */
        startAtImage?: boolean;
        draftDescription?: string;
        draftOrgan?: import("../features/case/types").OrganType;
        draftResultCategory?: string;
        draftTimestamp?: number;
        draftOradsInput?: import("../features/oradsPro/types").OradsInput;
      }
    | undefined;
  Paywall: undefined;
  Language: undefined;
  ORADSFlow: undefined;
  ORADSWizard:
    | {
        patientId?: string;
        /** ISO YYYY-MM-DD from patient meta.date_of_birth */
        patientBirthDateIso?: string;
      }
    | undefined;
  StructuredReportPreview: {
    /** Defaults to adnex when path/result present. */
    domain?: "adnex" | "thyroid" | "obstetric";
    /** O-RADS wizard handoff */
    path?: import("@repo/orads-us").OradsTreePathStep[];
    result?: import("@repo/orads-us").OradsTreeResult;
    pathSummary?: string[];
    /** TI-RADS / obstetric SRE inputs (already mapped) */
    thyroidInput?: import("@repo/types").ThyroidStructuredReportInput;
    obstetricInput?: import("@repo/types").ObstetricStructuredReportInput;
  };
  ORADSGuide: { sectionId?: string; caseId?: string } | undefined;
  ORADSPro: { prefill?: import("../features/oradsPro/types").OradsInput } | undefined;
  ORADSHistory: undefined;
  ORADSHistoryDetails: { caseId: string };
  FMFAssistant: undefined;
  Prolapse: undefined;
  GynecologyCalc: { initialPage?: import("../navigationTypes").PageType } | undefined;
  BiRadsAssistant: undefined;
  Breast3D: undefined;
  UltrasoundAssistant: undefined;
  TiRadsAssistant: undefined;
  EndometriumCalc: undefined;
  CervicalLengthCalc: undefined;
  SupabaseAuth: undefined;
  ClinicalReference: undefined;
  Nosology: undefined;
  ElastographyCalc: undefined;
  VascularCarotidCalc: undefined;
  ClinicalGuidelineDetail: { guidelineId: string };
  EvidenceAssistant: undefined;
  CervixCytologyModule:
    | {
        topic?: import("@repo/cervix-pathology-reference/cytology").CytologyTopicId;
        subFocus?: "thinprep" | "surepath";
      }
    | undefined;
};
