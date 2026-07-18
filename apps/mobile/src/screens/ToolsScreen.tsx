import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  CLINICAL_TOOLS,
  TOOL_CATEGORY_LABELS,
  type ClinicalTool,
  type DoctorRole,
  type ToolCategory,
} from "@repo/clinical-tools";

import {
  MiniUltrasoundPreview,
  OrganMedicalIllustration,
  type OrganIllustrationVariant,
} from "../components/calculators/OrganMedicalIllustration";
import { ClinicalToolSearchBar, PinnedToolsRow } from "../components/clinical/ClinicalToolSearch";
import { loadDoctorRole, resolvePinnedIds } from "../lib/doctorWorkspacePrefs";
import { openClinicalToolAction, openWebPath } from "../lib/clinical-tools/openClinicalTool";
import type { MainTabParamList, RootStackParamList } from "../navigation/paramLists";

export type ToolsTabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "ToolsTab">,
  NativeStackScreenProps<RootStackParamList>
>;

const CATEGORY_ORDER: ToolCategory[] = [
  "ovary",
  "uterus",
  "breast",
  "thyroid",
  "lymph",
  "pregnancy",
  "pelvic",
  "assistant",
];

const ART_BY_CATEGORY: Partial<Record<ToolCategory, OrganIllustrationVariant>> = {
  ovary: "ovary",
  uterus: "uterus",
  breast: "breast",
  thyroid: "thyroid",
  lymph: "lymph",
  pregnancy: "prenatal",
  pelvic: "prolapse",
};

function ToolCard({
  tool,
  width,
  onPress,
}: {
  tool: ClinicalTool;
  width: number;
  onPress: () => void;
}) {
  const art = ART_BY_CATEGORY[tool.category] ?? "uterus";
  return (
    <Pressable style={[styles.card, { width }]} onPress={onPress}>
      <View style={styles.artZone}>
        <OrganMedicalIllustration variant={art} width={width} height={90} />
        <View style={styles.usBadge}>
          <MiniUltrasoundPreview size={36} />
        </View>
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {tool.title}
      </Text>
      <Text style={styles.cardSub} numberOfLines={2}>
        {tool.subtitle}
      </Text>
    </Pressable>
  );
}

export default function ToolsScreen({ navigation }: ToolsTabScreenProps) {
  const { width: winW } = useWindowDimensions();
  const colW = Math.floor((winW - 32 - 14) / 2);
  const [role, setRole] = useState<DoctorRole | null>(null);
  const [pins, setPins] = useState<string[]>([]);

  useEffect(() => {
    void loadDoctorRole().then((r) => {
      setRole(r);
      void resolvePinnedIds(r).then(setPins);
    });
  }, []);

  const byCategory = useMemo(() => {
    const map = new Map<ToolCategory, ClinicalTool[]>();
    for (const t of CLINICAL_TOOLS) {
      if (t.category === "community" || t.category === "reference") continue;
      if (role && !t.roles.includes(role)) continue;
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      category: c,
      tools: map.get(c)!,
    }));
  }, [role]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Приём · УЗИ</Text>
        <Text style={styles.title}>Инструменты</Text>
        <Text style={styles.sub}>Калькуляторы отдельно · O-RADS хаб · поиск по синонимам</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.domainRow}>
          <Pressable style={styles.domainChip} onPress={() => openClinicalToolAction(navigation, "orads_hub")}>
            <Text style={styles.domainChipText}>O-RADS</Text>
          </Pressable>
          <Pressable style={styles.domainChip} onPress={() => void openWebPath("/tools/calc/ob")}>
            <Text style={styles.domainChipText}>Кальк. Б</Text>
          </Pressable>
          <Pressable style={styles.domainChip} onPress={() => void openWebPath("/tools/calc/gyn")}>
            <Text style={styles.domainChipText}>Кальк. гин.</Text>
          </Pressable>
          <Pressable style={styles.domainChip} onPress={() => void openWebPath("/tools/obstetrics")}>
            <Text style={styles.domainChipText}>Акушерство</Text>
          </Pressable>
          <Pressable style={styles.domainChip} onPress={() => void openWebPath("/tools/gynecology")}>
            <Text style={styles.domainChipText}>Гинекология</Text>
          </Pressable>
          <Pressable style={styles.domainChip} onPress={() => openClinicalToolAction(navigation, "cervix_pathology")}>
            <Text style={styles.domainChipText}>Цитология РШМ</Text>
          </Pressable>
        </View>
        <ClinicalToolSearchBar navigation={navigation} role={role} />
        <PinnedToolsRow navigation={navigation} toolIds={pins} />

        {byCategory.map(({ category, tools }) => (
          <View key={category} style={styles.section}>
            <Text style={styles.sectionTitle}>{TOOL_CATEGORY_LABELS[category]}</Text>
            <View style={styles.grid}>
              {tools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  width={colW}
                  onPress={() => tool.mobileAction && openClinicalToolAction(navigation, tool.mobileAction)}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const shadow =
  Platform.OS === "ios"
    ? { shadowColor: "#0F2744", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.07, shadowRadius: 12 }
    : { elevation: 3 };

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F9FB" },
  header: { paddingHorizontal: 16, paddingBottom: 8 },
  kicker: { fontSize: 11, fontWeight: "700", color: "#6B7C8F", letterSpacing: 1, textTransform: "uppercase" },
  title: { fontSize: 28, fontWeight: "800", color: "#0F2744", marginTop: 4 },
  sub: { fontSize: 14, color: "#5C6B7A", marginTop: 4 },
  scroll: { padding: 16, paddingBottom: 32, gap: 20 },
  domainRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  domainChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  domainChipText: { fontSize: 12, fontWeight: "700", color: "#0f2744" },
  section: { gap: 10 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  card: {
    borderRadius: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "rgba(15,39,68,0.06)",
    overflow: "hidden",
    paddingBottom: 12,
    ...shadow,
  },
  artZone: { height: 90, position: "relative" },
  usBadge: { position: "absolute", right: 8, bottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: "#0F2744", paddingHorizontal: 12, marginTop: 4 },
  cardSub: { fontSize: 11, color: "#64748b", paddingHorizontal: 12, marginTop: 4, lineHeight: 15 },
});
