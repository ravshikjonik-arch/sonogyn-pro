import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import {
  assessCervicalLength,
  buildCervicalProtocol,
  cervicalFormOptions,
  defaultCervicalInput,
  type CervicalAssessmentInput,
} from "../gynecology/cervix/cervicalLengthAssessment";
import { exportReportPdf } from "../reporting/exportReportPdf";
import type { RootStackParamList } from "../navigation/paramLists";

type Props = NativeStackScreenProps<RootStackParamList, "CervicalLengthCalc">;

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

export default function CervicalLengthScreen({ navigation }: Props) {
  const [input, setInput] = useState<CervicalAssessmentInput>({ ...defaultCervicalInput });

  const assessment = useMemo(() => assessCervicalLength(input), [input]);
  const report = useMemo(() => buildCervicalProtocol(input), [input]);

  function setField<K extends keyof CervicalAssessmentInput>(key: K, value: CervicalAssessmentInput[K]) {
    setInput((p) => ({ ...p, [key]: value }));
  }

  const riskColor =
    assessment.risk === "high" ? "#fecaca" : assessment.risk === "short" ? "#fde68a" : "#bbf7d0";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.back}>←</Text>
        </Pressable>
        <Text style={styles.title}>Длина шейки (CL)</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Срок, нед</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          placeholder="20"
          value={input.gestationalWeeks != null ? String(input.gestationalWeeks) : ""}
          onChangeText={(t) => {
            const v = parseInt(t, 10);
            setField("gestationalWeeks", Number.isFinite(v) ? v : undefined);
          }}
        />
        <Text style={styles.label}>CL, мм</Text>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          placeholder="28"
          value={input.cervicalLengthMm != null ? String(input.cervicalLengthMm) : ""}
          onChangeText={(t) => {
            const v = parseFloat(t.replace(",", "."));
            setField("cervicalLengthMm", Number.isFinite(v) ? v : undefined);
          }}
        />

        <Text style={styles.label}>Воронка</Text>
        <View style={styles.chips}>
          {cervicalFormOptions.funnelShape.map((o) => (
            <Chip
              key={o.value}
              label={o.label}
              on={input.funnelShape === o.value}
              onPress={() => setField("funnelShape", o.value)}
            />
          ))}
        </View>

        <View style={styles.chips}>
          <Chip
            label="Sludge"
            on={input.sludgePresent}
            onPress={() => setField("sludgePresent", !input.sludgePresent)}
          />
          <Chip
            label="Динам. укорочение"
            on={input.dynamicShortening}
            onPress={() => setField("dynamicShortening", !input.dynamicShortening)}
          />
          <Chip
            label="Выпячивание плодных оболочек"
            on={input.membraneBulging}
            onPress={() => setField("membraneBulging", !input.membraneBulging)}
          />
        </View>

        <View style={[styles.result, { backgroundColor: riskColor }]}>
          {assessment.messages.map((m) => (
            <Text key={m} style={styles.resultBody}>
              • {m}
            </Text>
          ))}
        </View>

        <Pressable style={styles.primary} onPress={() => void Clipboard.setStringAsync(report)}>
          <Text style={styles.primaryText}>Копировать протокол</Text>
        </Pressable>
        <Pressable
          style={styles.secondary}
          onPress={() => void exportReportPdf({ title: "CL · протокол", bodyText: report })}
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
  chipOn: { borderColor: "#0d9488", backgroundColor: "#ecfdf5" },
  chipText: { fontSize: 12, fontWeight: "700", color: "#334155" },
  chipTextOn: { color: "#0f766e" },
  result: { padding: 14, borderRadius: 14, gap: 6 },
  resultBody: { fontSize: 13, color: "#0f172a", lineHeight: 19 },
  primary: {
    backgroundColor: "#0d9488",
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
