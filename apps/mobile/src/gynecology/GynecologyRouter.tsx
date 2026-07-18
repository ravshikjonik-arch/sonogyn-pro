import type { PageType } from "../navigationTypes";
import FigoFibroidInteractive from "./FigoFibroidInteractive";
import ObgynClinicalAssistant from "./ObgynClinicalAssistant";
import UterusClinicScreen from "./UterusClinicScreen";
import Uterus3DScreen from "./Uterus3DScreen";
import { ScreenBreastRisk, ScreenLnRads } from "./screens/BreastLnScreens";
import { ScreenBishop, ScreenEfw, ScreenVbac } from "./screens/ObstetricScreens";
import { GynQuickAccess } from "./screens/GynQuickAccess";
import { GynHub } from "./screens/GynHub";
import { CervixHubScreen } from "./screens/CervixHubScreen";
import { ScreenMedvedevConsensus } from "./screens/MedvedevScreen";
import {
  ScreenCrl,
  ScreenDekret,
  ScreenFeto,
  ScreenGaLmp,
  ScreenGaUs,
  ScreenMsd,
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
    case "gyn_quick_access":
      return <GynQuickAccess setPage={setPage} />;
    case "gyn_bishop":
      return <ScreenBishop setPage={setPage} />;
    case "gyn_vbac":
      return <ScreenVbac setPage={setPage} />;
    case "gyn_efw":
      return <ScreenEfw setPage={setPage} />;
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
    case "gyn_ga_msd":
      return <ScreenMsd setPage={setPage} />;
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
    case "gyn_uterus_3d":
      return <Uterus3DScreen setPage={setPage} />;
    case "gyn_medvedev_consensus":
      return <ScreenMedvedevConsensus setPage={setPage} />;
    case "gyn_cervix_hub":
      return <CervixHubScreen setPage={setPage} />;
    default:
      return null;
  }
}
