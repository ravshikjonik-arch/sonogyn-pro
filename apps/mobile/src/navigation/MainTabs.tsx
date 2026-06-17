import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useMemo } from "react";
import { Platform } from "react-native";
import { ClinicalPhiGate } from "../components/ClinicalPhiGate";
import { useCases } from "../hooks/useCases";
import CommunityHubScreen from "../screens/CommunityHubScreen";
import ToolsScreen from "../screens/ToolsScreen";
import AssistantHubScreen from "../screens/AssistantHubScreen";
import KnowledgeScreen from "../screens/KnowledgeScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { DoctorRoleOnboarding } from "../components/clinical/DoctorRoleOnboarding";
import type { MainTabParamList } from "./paramLists";

const Tab = createBottomTabNavigator<MainTabParamList>();

const icons: Record<
  keyof MainTabParamList,
  { focused: keyof typeof Ionicons.glyphMap; outline: keyof typeof Ionicons.glyphMap }
> = {
  ChatTab: { focused: "chatbubbles", outline: "chatbubbles-outline" },
  ToolsTab: { focused: "medkit", outline: "medkit-outline" },
  AssistantTab: { focused: "hand-left", outline: "hand-left-outline" },
  KnowledgeTab: { focused: "book", outline: "book-outline" },
  ProfileTab: { focused: "person", outline: "person-outline" },
};

const labels: Record<keyof MainTabParamList, string> = {
  ChatTab: "Чат",
  ToolsTab: "Инструменты",
  AssistantTab: "Помощник",
  KnowledgeTab: "Справочник",
  ProfileTab: "Профиль",
};

export default function MainTabs() {
  return (
    <ClinicalPhiGate>
      <DoctorRoleOnboarding />
      <MainTabsInner />
    </ClinicalPhiGate>
  );
}

function MainTabsInner() {
  const { cases } = useCases();
  const casesCommentBadge = useMemo(() => {
    const n = cases.reduce((acc, c) => acc + (c.commentsCount ?? 0), 0);
    if (n <= 0) return undefined;
    return n > 99 ? "99+" : String(n);
  }, [cases]);

  return (
    <Tab.Navigator
      initialRouteName="ChatTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarLabel: labels[route.name as keyof MainTabParamList],
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
      <Tab.Screen
        name="ChatTab"
        component={CommunityHubScreen}
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
      <Tab.Screen name="ToolsTab" component={ToolsScreen} />
      <Tab.Screen name="AssistantTab" component={AssistantHubScreen} />
      <Tab.Screen name="KnowledgeTab" component={KnowledgeScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
