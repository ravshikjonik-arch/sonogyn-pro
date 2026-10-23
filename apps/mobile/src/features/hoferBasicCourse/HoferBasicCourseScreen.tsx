import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { HOFER_COURSE_DISCLAIMER, HOFER_PROBE_GUIDES } from "@repo/hofer-basic-course";

import type { RootStackParamList } from "../../navigation/paramLists";
import { webAppUrl } from "../../lib/clinical-tools/openClinicalTool";

type Props = NativeStackScreenProps<RootStackParamList, "HoferBasicCourse">;

export default function HoferBasicCourseScreen({ navigation }: Props) {
  const [expanded, setExpanded] = useState<string | null>(HOFER_PROBE_GUIDES[0]?.id ?? null);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button">
          <Text style={styles.back}>← Назад</Text>
        </Pressable>
        <Text style={styles.kicker}>Ординатор · пример</Text>
        <Text style={styles.title}>Датчик: куда и как</Text>
        <Text style={styles.sub}>Базовый курс УЗД (Хофер) — карточки как на web</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.disclaimer}>{HOFER_COURSE_DISCLAIMER}</Text>
        {HOFER_PROBE_GUIDES.map((g) => {
          const open = expanded === g.id;
          return (
            <View key={g.id} style={[styles.card, open && styles.cardOpen]}>
              <Pressable onPress={() => setExpanded(open ? null : g.id)} style={styles.cardHead}>
                <Text style={styles.cardTitle}>{g.title}</Text>
                <Text style={styles.badge}>{g.bookPages ?? g.moduleId}</Text>
              </Pressable>
              {open ? (
                <View style={styles.cardBody}>
                  <Label title="Куда ставить" body={g.placement} />
                  <Label title="Датчик" body={g.probe} />
                  <Label title="Техника" body={g.technique} />
                  {g.pitfalls.map((p) => (
                    <Text key={p} style={styles.pitfall}>
                      • {p}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}
        <Pressable
          style={styles.webBtn}
          onPress={() => void Linking.openURL(webAppUrl("/tools/refs/hofer-basic-course?tab=probe"))}
        >
          <Text style={styles.webBtnText}>Полный курс на web (модули + тест)</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Label({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.labelBlock}>
      <Text style={styles.labelTitle}>{title}</Text>
      <Text style={styles.labelBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F9FB" },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#E8EDF2", gap: 4 },
  back: { color: "#0d9488", fontWeight: "700", marginBottom: 4 },
  kicker: { fontSize: 11, fontWeight: "700", color: "#64748b" },
  title: { fontSize: 22, fontWeight: "800", color: "#0F2744" },
  sub: { fontSize: 13, color: "#64748b" },
  scroll: { padding: 16, paddingBottom: 32, gap: 10 },
  disclaimer: { fontSize: 11, color: "#64748b", lineHeight: 16, marginBottom: 4 },
  card: { borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#fff", overflow: "hidden" },
  cardOpen: { borderColor: "#0d9488" },
  cardHead: { padding: 14, flexDirection: "row", justifyContent: "space-between", gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: "800", color: "#0F2744" },
  badge: { fontSize: 10, color: "#64748b" },
  cardBody: { borderTopWidth: 1, borderTopColor: "#e2e8f0", padding: 14, gap: 10 },
  labelBlock: { gap: 4 },
  labelTitle: { fontSize: 11, fontWeight: "800", color: "#0d9488", textTransform: "uppercase" },
  labelBody: { fontSize: 13, color: "#334155", lineHeight: 19 },
  pitfall: { fontSize: 12, color: "#475569", lineHeight: 18 },
  webBtn: {
    marginTop: 8,
    backgroundColor: "#0F2744",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  webBtnText: { color: "#fff", fontWeight: "700" },
});
