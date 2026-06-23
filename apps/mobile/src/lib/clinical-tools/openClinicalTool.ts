import type { MobileToolAction } from "@repo/clinical-tools";
import * as WebBrowser from "expo-web-browser";
import { Linking } from "react-native";

import { openTelegramChannel } from "../../config/community";
import { PRODUCT } from "../../config/product";
import type { PageType } from "../navigationTypes";
import type { RootStackParamList } from "../navigation/paramLists";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

const WEB_APP =
  (process.env.EXPO_PUBLIC_WEB_APP_URL || "https://sonogyn-pro-web.vercel.app").replace(/\/$/, "");

export function webAppUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${WEB_APP}${p}`;
}

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function openClinicalToolAction(navigation: Nav, action: MobileToolAction): void {
  switch (action) {
    case "chat_web":
      void WebBrowser.openBrowserAsync(webAppUrl("/cases"));
      return;
    case "new_case":
      navigation.navigate("Case", { caseId: undefined });
      return;
    case "telegram":
      void openTelegramChannel();
      return;
    case "elastography":
      navigation.navigate("ElastographyCalc");
      return;
    case "orads":
      navigation.navigate("ORADSPro");
      return;
    case "orads_wizard":
      navigation.navigate("ORADSPro");
      return;
    case "orads_guide":
      navigation.navigate("ORADSGuide");
      return;
    case "orads_flow":
      navigation.navigate("ORADSFlow");
      return;
    case "birads":
      navigation.navigate("BiRadsAssistant");
      return;
    case "breast_3d":
      navigation.navigate("Breast3D");
      return;
    case "tirads":
      navigation.navigate("TiRadsAssistant");
      return;
    case "uterus_clinic":
      navigation.navigate("GynecologyCalc", { initialPage: "gyn_uterus_clinic" });
      return;
    case "endometrium":
      navigation.navigate("EndometriumCalc");
      return;
    case "cervical_length":
      navigation.navigate("CervicalLengthCalc");
      return;
    case "popq":
      navigation.navigate("Prolapse");
      return;
    case "colposcopy":
      void WebBrowser.openBrowserAsync(webAppUrl("/calculators/colposcopy"));
      return;
    case "cin_risk":
      void WebBrowser.openBrowserAsync(webAppUrl("/calculators/cin-risk"));
      return;
    case "cervical_intelligence":
      void WebBrowser.openBrowserAsync(webAppUrl("/calculators/cervical-intelligence"));
      return;
    case "fmf":
      navigation.navigate("FMFAssistant");
      return;
    case "ln_rads":
      navigation.navigate("GynecologyCalc", { initialPage: "gyn_lnrads" });
      return;
    case "gyn_assistant_gyn":
      navigation.navigate("GynecologyCalc", { initialPage: "gyn_assistant_gynecology" });
      return;
    case "gyn_assistant_obs":
      navigation.navigate("GynecologyCalc", { initialPage: "gyn_assistant_obstetrics" });
      return;
    case "gyn_hub":
      navigation.navigate("GynecologyCalc", { initialPage: "gyn_hub" });
      return;
    case "ga_lmp":
      navigation.navigate("GynecologyCalc", { initialPage: "gyn_ga_lmp" });
      return;
    case "ga_us":
      navigation.navigate("GynecologyCalc", { initialPage: "gyn_ga_us" });
      return;
    case "ga_crl":
      navigation.navigate("GynecologyCalc", { initialPage: "gyn_ga_crl" });
      return;
    case "nosology":
      navigation.navigate("Nosology");
      return;
    case "clinical_ref":
      navigation.navigate("ClinicalReference");
      return;
    case "guidelines":
      navigation.getParent()?.navigate("KnowledgeTab", { section: "guidelines" });
      return;
    case "medvedev":
      navigation.navigate("GynecologyCalc", { initialPage: "gyn_medvedev_consensus" });
      return;
    default:
      return;
  }
}

export function openGynPage(navigation: Nav, page: PageType): void {
  navigation.navigate("GynecologyCalc", { initialPage: page });
}

export async function openWebPath(path: string): Promise<void> {
  const url = webAppUrl(path);
  const can = await Linking.canOpenURL(url);
  if (can) await Linking.openURL(url);
  else await WebBrowser.openBrowserAsync(url);
}
