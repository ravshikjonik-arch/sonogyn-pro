import { Ionicons } from "@expo/vector-icons";
import { CLINICAL_PRIMARY_NAV, getMobileTabLabel } from "@repo/clinical-tools";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useMemo } from "react";
import { Platform } from "react-native";
import { ClinicalPhiGate } from "../components/ClinicalPhiGate";
import { canAccessClinicalPhi } from "../lib/security/clinicalAccessGuard";
import { useCases } from "../hooks/useCases";
import CasesScreen, { type CasesTabScreenProps } from "../screens/CasesScreen";
import ToolsScreen from "../screens/ToolsScreen";
import AssistantHubScreen from "../screens/AssistantHubScreen";
import HomeScreen from "../screens/HomeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { DoctorRoleOnboarding } from "../components/clinical/DoctorRoleOnboarding";
import type { MainTabParamList } from "./paramLists";

const Tab = createBottomTabNavigator<MainTabParamList>();

const icons: Record<
  keyof MainTabParamList,
  { focused: keyof typeof Ionicons.glyphMap; outline: keyof typeof Ionicons.glyphMap }
> = {
  FeedTab: { focused: "newspaper", outline: "newspaper-outline" },
  CasesTab: { focused: "chatbubbles", outline: "chatbubbles-outline" },
  AiTab: { focused: "sparkles", outline: "sparkles-outline" },
  ToolsTab: { focused: "medkit", outline: "medkit-outline" },
  ProfileTab: { focused: "person", outline: "person-outline" },
};

/** Tab order from SSOT — same sequence as web bottom nav. */
const TAB_ORDER = CLINICAL_PRIMARY_NAV.map((e) => e.mobileTab);

function GuardedCasesScreen(props: CasesTabScreenProps) {
  return (
    <ClinicalPhiGate>
      <CasesScreen {...props} />
    </ClinicalPhiGate>
  );
}

export default function MainTabs() {
  return (
    <>
      <DoctorRoleOnboarding />
      <MainTabsInner />
    </>
  );
}

function MainTabsInner() {
  const { cases } = useCases();
  const casesCommentBadge = useMemo(() => {
    const n = cases.reduce((acc, c) => acc + (c.commentsCount ?? 0), 0);
    if (n <= 0) return undefined;
    return n > 99 ? "99+" : String(n);
  }, [cases]);

  const initialRouteName: keyof MainTabParamList = canAccessClinicalPhi() ? "FeedTab" : "ToolsTab";

  return (
    <Tab.Navigator
      initialRouteName={initialRouteName}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarLabel: getMobileTabLabel(route.name as keyof MainTabParamList),
        tabBarActiveTintColor: "#059669",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarLabelStyle: { fontSize: 10, fontWeight: "600", letterSpacing: 0.2 },
        tabBarStyle: {
          paddingTop: 6,
          paddingBottom: Platform.OS === "ios" ? 22 : 10,
          minHeight: Platform.OS === "ios" ? 86 : 60,
          borderTopWidth: 1,
          borderTopColor: "#e8ecf1",
          backgroundColor: "#ffffff",
        },
        tabBarIcon: ({ color, focused, size }) => {
          const set = icons[route.name as keyof MainTabParamList];
          const name = focused ? set.focused : set.outline;
          return <Ionicons name={name} size={size - 1} color={color} />;
        },
      })}
    >
      {TAB_ORDER.map((name) => {
        if (name === "FeedTab") {
          return <Tab.Screen key={name} name="FeedTab" component={HomeScreen} />;
        }
        if (name === "CasesTab") {
          return (
            <Tab.Screen
              key={name}
              name="CasesTab"
              component={GuardedCasesScreen}
              options={{
                tabBarBadge: casesCommentBadge,
                tabBarBadgeStyle: {
                  backgroundColor: "#dc2626",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: "800",
                },
              }}
            />
          );
        }
        if (name === "AiTab") {
          return <Tab.Screen key={name} name="AiTab" component={AssistantHubScreen} />;
        }
        if (name === "ToolsTab") {
          return <Tab.Screen key={name} name="ToolsTab" component={ToolsScreen} />;
        }
        return <Tab.Screen key={name} name="ProfileTab" component={ProfileScreen} />;
      })}
    </Tab.Navigator>
  );
}
