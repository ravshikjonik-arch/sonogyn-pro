import type { OradsInput } from "../features/oradsPro/types";
import type { OrganType } from "../features/case/types";
import type { PageType } from "../navigationTypes";

export type MainTabParamList = {
  HomeTab: undefined;
  CasesTab: undefined;
  CalculatorsTab: undefined;
  LibraryTab: undefined;
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
  Main: undefined;
  Case:
    | {
        caseId?: string;
        /** Открыть мастер сразу на шаге загрузки снимка (новый кейс). */
        startAtImage?: boolean;
        draftDescription?: string;
        draftOrgan?: OrganType;
        draftResultCategory?: string;
        draftTimestamp?: number;
        draftOradsInput?: OradsInput;
      }
    | undefined;
  Paywall: undefined;
  Language: undefined;
  ORADSFlow: undefined;
  ORADSPro: { prefill?: OradsInput } | undefined;
  ORADSHistory: undefined;
  ORADSHistoryDetails: { caseId: string };
  FMFAssistant: undefined;
  Prolapse: undefined;
  GynecologyCalc: { initialPage?: PageType } | undefined;
  BiRadsAssistant: undefined;
  TiRadsAssistant: undefined;
  SupabaseAuth: undefined;
  ClinicalReference: undefined;
  Nosology: undefined;
};
