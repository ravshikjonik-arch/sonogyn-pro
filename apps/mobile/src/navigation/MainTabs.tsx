import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useMemo } from "react";
import { Platform } from "react-native";
import { branding } from "../config/branding";
import { useCases } from "../hooks/useCases";
import CasesScreen from "../screens/CasesScreen";
import CalculatorsScreen from "../screens/CalculatorsScreen";
import HomeScreen from "../screens/HomeScreen";
import GuidelinesTabScreen from "../modules/clinicalGuidelines/screens/GuidelinesTabScreen";
import LibraryScreen from "../screens/LibraryScreen";
import ProfileScreen from "../screens/ProfileScreen";
import type { MainTabParamList } from "./paramLists";

const Tab = createBottomTabNavigator<MainTabParamList>();

const icons: Record<
  keyof MainTabParamList,
  { focused: keyof typeof Ionicons.glyphMap; outline: keyof typeof Ionicons.glyphMap }
> = {
  HomeTab: { focused: "home", outline: "home-outline" },
  CasesTab: { focused: "layers", outline: "layers-outline" },
  CalculatorsTab: { focused: "grid", outline: "grid-outline" },
  LibraryTab: { focused: "book", outline: "book-outline" },
  GuidelinesTab: { focused: "document-text", outline: "document-text-outline" },
  ProfileTab: { focused: "person", outline: "person-outline" },
};

const labels: Record<keyof MainTabParamList, string> = {
  HomeTab: "Главная",
  CasesTab: "Кейсы",
  CalculatorsTab: "Калькуляторы",
  LibraryTab: "Библиотека",
  GuidelinesTab: "КР",
  ProfileTab: "Профиль",
};

export default function MainTabs() {
  const { cases } = useCases();
  const casesCommentBadge = useMemo(() => {
    const n = cases.reduce((acc, c) => acc + (c.commentsCount ?? 0), 0);
    if (n <= 0) return undefined;
    return n > 99 ? "99+" : String(n);
  }, [cases]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarLabel: labels[route.name as keyof MainTabParamList],
        tabBarActiveTintColor: "#6D28D9",
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
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen
        name="CasesTab"
        component={CasesScreen}
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
      <Tab.Screen name="CalculatorsTab" component={CalculatorsScreen} />
      <Tab.Screen name="LibraryTab" component={LibraryScreen} />
      <Tab.Screen name="GuidelinesTab" component={GuidelinesTabScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
