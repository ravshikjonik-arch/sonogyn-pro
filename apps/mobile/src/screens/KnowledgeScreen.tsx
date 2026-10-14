/**
 * @deprecated Справочник встроен во вкладку «Инструменты» (panel=reference).
 * Экран оставлен для совместимости импортов — перенаправляет в ToolsTab.
 */
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect } from "react";

import type { MainTabParamList, RootStackParamList } from "../navigation/paramLists";

export type KnowledgeTabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "ToolsTab">,
  NativeStackScreenProps<RootStackParamList>
>;

export default function KnowledgeScreen({ navigation, route }: KnowledgeTabScreenProps) {
  useEffect(() => {
    navigation.navigate("ToolsTab", {
      panel: "reference",
      referenceSection: route.params?.referenceSection === "guidelines" ? "guidelines" : undefined,
    });
  }, [navigation, route.params?.referenceSection]);

  return null;
}
