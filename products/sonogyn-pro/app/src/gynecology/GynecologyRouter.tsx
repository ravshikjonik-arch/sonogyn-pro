import type { PageType } from "../navigationTypes";
import FigoFibroidInteractive from "./FigoFibroidInteractive";
import ObgynClinicalAssistant from "./ObgynClinicalAssistant";
import UterusClinicScreen from "./UterusClinicScreen";
import { ScreenBreastRisk, ScreenLnRads } from "./screens/BreastLnScreens";
import { GynHub } from "./screens/GynHub";
import { ScreenMedvedevConsensus } from "./screens/MedvedevScreen";
import {
  ScreenCrl,
  ScreenDekret,
  ScreenFeto,
  ScreenGaLmp,
  ScreenGaUs,
  ScreenOvoIvf,
} from "./screens/PregnancyScreens";

type Props = {
  page: PageType;
  setPage: (p: PageType) => void;
};

function ScreenFigoFibroid({ setPage }: { setPage: (p: PageType) => void }) {
  return <FigoFibroidInteractive onBack={() => setPage("gyn_hub")} />;
}

export function GynecologyRouter({ page, setPage }: Props) {
  switch (page) {
    case "gyn_hub":
      return <GynHub setPage={setPage} />;
    case "gyn_assistant_gynecology":
      return <ObgynClinicalAssistant mode="gynecology" onBack={() => setPage("gyn_hub")} />;
    case "gyn_assistant_obstetrics":
      return <ObgynClinicalAssistant mode="obstetrics" onBack={() => setPage("gyn_hub")} />;
    case "gyn_ga_lmp":
      return <ScreenGaLmp setPage={setPage} />;
    case "gyn_ga_us":
      return <ScreenGaUs setPage={setPage} />;
    case "gyn_ga_ovo_ivf":
      return <ScreenOvoIvf setPage={setPage} />;
    case "gyn_dekret":
      return <ScreenDekret setPage={setPage} />;
    case "gyn_ga_crl":
      return <ScreenCrl setPage={setPage} />;
    case "gyn_ga_feto":
      return <ScreenFeto setPage={setPage} />;
    case "gyn_breast_risk":
      return <ScreenBreastRisk setPage={setPage} />;
    case "gyn_lnrads":
      return <ScreenLnRads setPage={setPage} />;
    case "gyn_figo_fibroid":
      return <ScreenFigoFibroid setPage={setPage} />;
    case "gyn_uterus_clinic":
      return <UterusClinicScreen setPage={setPage} />;
    case "gyn_medvedev_consensus":
      return <ScreenMedvedevConsensus setPage={setPage} />;
    default:
      return null;
  }
}
