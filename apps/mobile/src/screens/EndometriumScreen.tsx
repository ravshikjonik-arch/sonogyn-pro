import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import {
  assessThickness,
  buildEndometriumProtocol,
  defaultEndometriumInput,
  endometriumFormOptions,
  evaluateFocalLesionTactic,
  type EndometriumAssessmentInput,
} from "../gynecology/endometrium/endometriumAssessment";
import { exportReportPdf } from "../reporting/exportReportPdf";
import type { RootStackParamList } from "../navigation/paramLists";

type Props = NativeStackScreenProps<RootStackParamList, "EndometriumCalc">;

function Chip({
  label,
  on,
  onPress,
}: {
  label: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.chip, on && styles.chipOn]} onPress={onPress}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

export default function EndometriumScreen({ navigation }: Props) {
  const [input, setInput] = useState<EndometriumAssessmentInput>({ ...defaultEndometriumInput });

  const thickness = useMemo(() => assessThickness(input), [input]);
  const focal = useMemo(() => evaluateFocalLesionTactic(input), [input]);
  const report = useMemo(() => buildEndometriumProtocol(input), [input]);

  function setField<K extends keyof EndometriumAssessmentInput>(key: K, value: EndometriumAssessmentInput[K]) {
    setInput((p) => ({ ...p, [key]: value }));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Text style={styles.title}>Эндометрий</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>M-эхо, мм</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="8.4"
          value={input.thicknessMm != null ? String(input.thicknessMm) : ""}
          onChangeText={(t) => {
            const v = parseFloat(t.replace(",", "."));
            setField("thicknessMm", Number.isFinite(v) ? v : undefined);
          }}
        />

        <Text style={styles.label}>Контекст пациентки</Text>
        <View style={styles.chips}>
          {endometriumFormOptions.patientContext.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              on={input.patientContext === o.value}
              onPress={() => setField("patientContext", o.value)}
            />
          ))}
        </View>

        <Text style={styles.label}>Жидкость в полости</Text>
        <View style={styles.chips}>
          {endometriumFormOptions.fluidInCavity.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              on={input.fluidInCavity === o.value}
              onPress={() => setField("fluidInCavity", o.value)}
            />
          ))}
        </View>

        <View style={styles.result}>
          <Text style={styles.resultTitle}>
            M-эхо: {thickness.effectiveMm ?? "—"} мм · {thickness.isuogNote}
          </Text>
          <Text style={styles.resultBody}>{focal.action}</Text>
        </View>

        <Pressable style={styles.primary} onPress={() => void Clipboard.setStringAsync(report)}>
          <Text style={styles.primaryText}>Копировать протокол</Text>
        </Pressable>
        <Pressable
          style={styles.secondary}
          onPress={() => void exportReportPdf({ title: "Эндометрий · протокол", bodyText: report })}
        >
          <Text style={styles.secondaryText}>PDF</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  back: { fontSize: 22, fontWeight: "600" },
  title: { fontSize: 17, fontWeight: "800" },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  label: { fontSize: 11, fontWeight: "800", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6 },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  chipOn: { borderColor: "#be185d", backgroundColor: "#fdf2f8" },
  chipText: { fontSize: 12, fontWeight: "700", color: "#334155" },
  chipTextOn: { color: "#9d174d" },
  result: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 8,
  },
  resultTitle: { fontSize: 15, fontWeight: "800", color: "#0f172a" },
  resultBody: { fontSize: 13, color: "#475569", lineHeight: 19 },
  primary: {
    backgroundColor: "#be185d",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  secondary: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  secondaryText: { fontWeight: "700", color: "#0f172a" },
});
