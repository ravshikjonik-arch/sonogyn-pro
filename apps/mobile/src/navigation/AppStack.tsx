import { NavigationContainer, type LinkingOptions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useState, type ComponentType } from "react";
import { Platform } from "react-native";
import CaseScreen from "../screens/CaseScreen";
import LandingScreen from "../screens/LandingScreen";
import PaywallScreen from "../screens/PaywallScreen";
import TermsScreen from "../screens/TermsScreen";
import PrivacyScreen from "../screens/PrivacyScreen";
import DisclaimerScreen from "../screens/DisclaimerScreen";
import ConsentScreen from "../screens/ConsentScreen";
import LanguageScreen from "../screens/LanguageScreen";
import { initI18n } from "../i18n";
import BlockedScreen from "../screens/BlockedScreen";
import { ensureAnonymousAuth } from "../services/firebase/authService";
import { isUserBanned } from "../services/firebase/reportService";
import ORADSFlowScreen from "../screens/ORADSFlowScreen";
import ProlapseScreen from "../screens/ProlapseScreen";
import ORADSProScreen from "../features/oradsPro/screens/ORADSProScreen";
import ORADSHistoryScreen from "../features/oradsPro/screens/ORADSHistoryScreen";
import ORADSHistoryDetailsScreen from "../features/oradsPro/screens/ORADSHistoryDetailsScreen";
import FMFAssistantScreen from "../features/fmf/screens/FMFAssistantScreen";
import GynecologyCalcScreen from "../screens/GynecologyCalcScreen";
import BiRadsAssistantScreen from "../screens/BiRadsAssistantScreen";
import Breast3DScreen from "../screens/Breast3DScreen";
import TiRadsAssistantScreen from "../features/tirads/screens/TiRadsAssistantScreen";
import ClinicalReferenceScreen from "../screens/ClinicalReferenceScreen";
import NosologyScreen from "../screens/NosologyScreen";
import SplashScreen, { SplashLoadingView } from "../screens/SplashScreen";
import SupabaseAuthScreen from "../screens/SupabaseAuthScreen";
import ClinicalGuidelineDetailScreen from "../modules/clinicalGuidelines/screens/ClinicalGuidelineDetailScreen";
import ElastographyScreen from "../modules/elastography/screens/ElastographyScreen";
import { ClinicalPhiGate } from "../components/ClinicalPhiGate";
import MainTabs from "./MainTabs";
import type { RootStackParamList } from "./paramLists";
import type { PageType } from "../navigationTypes";
import { hasValidConsent } from "../legal/consentStorage";
import { supabaseMobile } from "../lib/supabase/mobileClient";
import { wipeMobileClinicalLocalData } from "../lib/security/wipeClinicalLocal";
import { useAuthDeepLinks } from "../hooks/useAuthDeepLinks";
import { useSessionRevalidation } from "../hooks/useSessionRevalidation";
import { AppGateContext } from "./AppGateContext";

export type { MainTabParamList, RootStackParamList } from "./paramLists";

const Stack = createNativeStackNavigator<RootStackParamList>();

function withClinicalPhiGate<P extends object>(Screen: ComponentType<P>) {
  return function GuardedScreen(props: P) {
    return (
      <ClinicalPhiGate>
        <Screen {...props} />
      </ClinicalPhiGate>
    );
  };
}

const GuardedORADSPro = withClinicalPhiGate(ORADSProScreen);
const GuardedORADSHistory = withClinicalPhiGate(ORADSHistoryScreen);
const GuardedORADSHistoryDetails = withClinicalPhiGate(ORADSHistoryDetailsScreen);

function parseGynecologyInitialPage(segment?: string): PageType {
  if (!segment) return "gyn_hub";
  if (segment.startsWith("gyn_")) return segment as PageType;
  return "gyn_hub";
}

function linkingPrefixes(): string[] {
  const out = new Set<string>([
    "https://sonogyn.com",
    "https://www.sonogyn.com",
    "https://sonogyn.ru",
    "https://www.sonogyn.ru",
    "https://us-risk-calc.app",
    "usriskcalc://",
    "com.yakrav7700.usriskcalc://",
  ]);
  if (typeof window !== "undefined" && window.location?.origin) {
    out.add(window.location.origin);
  }
  for (const port of [19000, 19001, 19002, 19003, 19004, 19005, 19006, 8081]) {
    out.add(`http://localhost:${port}`);
  }
  return [...out];
}

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: linkingPrefixes(),
  config: {
    screens: {
      Landing: "",
      Splash: "start",
      Consent: "consent",
      TermsOfUse: "terms",
      PrivacyPolicy: "privacy",
      MedicalDisclaimer: "medical-disclaimer",
      Main: "app",
      Case: {
        path: "case/:caseId?",
        parse: {
          startAtImage: (value) => value === "true",
        },
      },
      Paywall: "pro",
      SupabaseAuth: "auth/supabase",
      Language: "language",
      ORADSFlow: "orads-basic",
      ORADSPro: "orads",
      ORADSHistory: "orads/history",
      ORADSHistoryDetails: "orads/history/:caseId",
      FMFAssistant: "fmf",
      Prolapse: "prolapse",
      GynecologyCalc: {
        path: "gynecology/:initialPage?",
        parse: {
          initialPage: (value?: string) => parseGynecologyInitialPage(value),
        },
      },
      BiRadsAssistant: "birads",
      TiRadsAssistant: "tirads",
      ClinicalReference: "reference/clinical",
      Nosology: "reference/nosologies",
      ElastographyCalc: "elastography",
      ClinicalGuidelineDetail: "guidelines/:guidelineId",
      Blocked: "blocked",
    },
  },
};

export default function AppStack() {
  const [checked, setChecked] = useState(false);
  const [consentOk, setConsentOk] = useState(false);
  const [banned, setBanned] = useState(false);
  const [supabaseSession, setSupabaseSession] = useState<Session | null>(null);
  const [supabaseReady, setSupabaseReady] = useState(false);

  const refreshSupabaseSession = useCallback(async () => {
    if (!supabaseMobile) {
      setSupabaseSession(null);
      setSupabaseReady(true);
      return;
    }
    const { data } = await supabaseMobile.auth.getSession();
    setSupabaseSession(data.session);
    setSupabaseReady(true);
  }, []);

  useEffect(() => {
    void refreshSupabaseSession();
    if (!supabaseMobile) return;
    const { data: sub } = supabaseMobile.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        void wipeMobileClinicalLocalData();
      }
      setSupabaseSession(session);
      setSupabaseReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [refreshSupabaseSession]);

  useAuthDeepLinks(() => {
    void refreshSupabaseSession();
  });

  useSessionRevalidation(Boolean(supabaseSession));

  useEffect(() => {
    const STARTUP_MS = 10_000;
    const CONSENT_FALLBACK_MS = 2_500;
    let cancelled = false;

    async function loadGate() {
      async function runGate(): Promise<{ banned: boolean; consentOk: boolean }> {
        await initI18n();
        const authUser = await ensureAnonymousAuth();
        const banned = await isUserBanned(authUser.uid);
        const consentOk = await hasValidConsent();
        return { banned, consentOk };
      }

      try {
        const outcome = await Promise.race([
          runGate(),
          new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), STARTUP_MS)),
        ]);

        if (cancelled) return;

        if (outcome === "timeout") {
          if (__DEV__) {
            console.warn(
              `[AppGate] Startup exceeded ${STARTUP_MS}ms (Firebase/network). Releasing UI without ban check.`,
            );
          }
          setBanned(false);
          try {
            const ok = await Promise.race([
              hasValidConsent(),
              new Promise<boolean>((resolve) => setTimeout(() => resolve(false), CONSENT_FALLBACK_MS)),
            ]);
            setConsentOk(ok);
          } catch {
            setConsentOk(false);
          }
        } else {
          setBanned(outcome.banned);
          setConsentOk(outcome.consentOk);
        }
      } catch (e) {
        if (!cancelled) {
          console.warn("[AppGate] Startup failed:", e);
          setBanned(false);
          setConsentOk(false);
        }
      } finally {
        if (!cancelled) setChecked(true);
      }
    }

    void loadGate();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!checked) {
    return <SplashLoadingView />;
  }

  if (banned) {
    return (
      <NavigationContainer linking={linking}>
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Blocked">
          <Stack.Screen name="Blocked" component={BlockedScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <AppGateContext.Provider value={{ consentOk, supabaseReady, supabaseSession, refreshSupabaseSession }}>
      <NavigationContainer linking={linking}>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={Platform.OS === "web" ? "Landing" : "Splash"}
        >
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Consent" component={ConsentScreen} options={{ gestureEnabled: false }} />
          <Stack.Screen name="TermsOfUse" component={TermsScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyScreen} />
          <Stack.Screen name="MedicalDisclaimer" component={DisclaimerScreen} />
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="Case" component={CaseScreen} />
          <Stack.Screen name="Paywall" component={PaywallScreen} />
          <Stack.Screen name="SupabaseAuth" component={SupabaseAuthScreen} />
          <Stack.Screen name="Language" component={LanguageScreen} />
          <Stack.Screen name="ORADSFlow" component={ORADSFlowScreen} />
          <Stack.Screen name="ORADSPro" component={GuardedORADSPro} />
          <Stack.Screen name="ORADSHistory" component={GuardedORADSHistory} />
          <Stack.Screen name="ORADSHistoryDetails" component={GuardedORADSHistoryDetails} />
          <Stack.Screen name="FMFAssistant" component={FMFAssistantScreen} />
          <Stack.Screen name="Prolapse" component={ProlapseScreen} />
          <Stack.Screen name="GynecologyCalc" component={GynecologyCalcScreen} />
          <Stack.Screen name="BiRadsAssistant" component={BiRadsAssistantScreen} />
          <Stack.Screen name="Breast3D" component={Breast3DScreen} />
          <Stack.Screen name="TiRadsAssistant" component={TiRadsAssistantScreen} />
          <Stack.Screen name="ClinicalReference" component={ClinicalReferenceScreen} />
          <Stack.Screen name="Nosology" component={NosologyScreen} />
          <Stack.Screen name="ElastographyCalc" component={ElastographyScreen} />
          <Stack.Screen name="ClinicalGuidelineDetail" component={ClinicalGuidelineDetailScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AppGateContext.Provider>
  );
}
