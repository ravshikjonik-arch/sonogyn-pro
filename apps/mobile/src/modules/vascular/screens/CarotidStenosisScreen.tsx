import * as Clipboard from "expo-clipboard";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import type { RootStackParamList } from "../../../navigation/paramLists";
import {
  buildCarotidStenosisReport,
  gradeCarotidStenosis,
  type CarotidStenosisInput,
} from "@repo/vascular-kulikov";

type Props = NativeStackScreenProps<RootStackParamList, "VascularCarotidCalc">;

function parseNum(text: string): number | undefined {
  const v = parseFloat(text.replace(",", "."));
  return Number.isFinite(v) ? v : undefined;
}

const GRADE_COLOR: Record<string, string> = {
  normal: "#bbf7d0",
  mild: "#fef9c3",
  moderate: "#fde68a",
  severe: "#fecaca",
  occlusion: "#fca5a5",
};

export default function CarotidStenosisScreen({ navigation }: Props) {
  const [input, setInput] = useState<CarotidStenosisInput>({});

  const result = useMemo(() => gradeCarotidStenosis(input), [input]);
  const report = useMemo(() => buildCarotidStenosisReport(input, result), [input, result]);

  function setField<K extends keyof CarotidStenosisInput>(key: K, value: CarotidStenosisInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Text style={styles.title}>Стеноз ВСА</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.hint}>PSV / EDV / ICA·CCA ratio — табл. 4.1 Куликов (SVU consensus)</Text>

        <Text style={styles.label}>PSV ВСА, см/с</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="125"
          value={input.psvIcaCmS != null ? String(input.psvIcaCmS) : ""}
          onChangeText={(t) => setField("psvIcaCmS", parseNum(t))}
        />

        <Text style={styles.label}>EDV ВСА, см/с</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="40"
          value={input.edvIcaCmS != null ? String(input.edvIcaCmS) : ""}
          onChangeText={(t) => setField("edvIcaCmS", parseNum(t))}
        />

        <Text style={styles.label}>PSV ОСА, см/с</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="80"
          value={input.psvCcaCmS != null ? String(input.psvCcaCmS) : ""}
          onChangeText={(t) => setField("psvCcaCmS", parseNum(t))}
        />

        <Text style={styles.label}>Морфология NASCET, %</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="опционально"
          value={input.morphologicPercent != null ? String(input.morphologicPercent) : ""}
          onChangeText={(t) => setField("morphologicPercent", parseNum(t))}
        />

        <View style={styles.switchRow}>
          <Text style={styles.label}>Подозрение на окклюзию</Text>
          <Switch
            value={Boolean(input.occlusionSuspected)}
            onValueChange={(v) => setField("occlusionSuspected", v)}
          />
        </View>

        <View style={[styles.result, { backgroundColor: GRADE_COLOR[result.grade] ?? "#e5e7eb" }]}>
          <Text style={styles.resultTitle}>
            {result.label} ({result.percentRange})
          </Text>
          {result.criteria.map((c) => (
            <Text key={c} style={styles.resultBody}>
              • {c}
            </Text>
          ))}
          <Text style={styles.resultNote}>{result.strokeRiskNote}</Text>
        </View>

        <Pressable style={styles.primary} onPress={() => void Clipboard.setStringAsync(report)}>
          <Text style={styles.primaryText}>Копировать в протокол</Text>
        </Pressable>

        <Text style={styles.disclaimer}>Не диагноз. Интерпретация — лечащий врач.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  back: { fontSize: 24, color: "#6D28D9" },
  title: { fontSize: 17, fontWeight: "600", color: "#111827" },
  scroll: { padding: 16, paddingBottom: 32, gap: 8 },
  hint: { fontSize: 13, color: "#6b7280", marginBottom: 8 },
  label: { fontSize: 14, fontWeight: "500", color: "#374151", marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#f9fafb",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 8,
  },
  result: { borderRadius: 12, padding: 14, marginTop: 12, gap: 4 },
  resultTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 4 },
  resultBody: { fontSize: 14, color: "#1f2937", lineHeight: 20 },
  resultNote: { fontSize: 13, color: "#374151", marginTop: 6, fontStyle: "italic" },
  primary: {
    marginTop: 16,
    backgroundColor: "#6D28D9",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  disclaimer: { fontSize: 12, color: "#9ca3af", textAlign: "center", marginTop: 12 },
});
