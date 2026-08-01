import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import type { ThyroidPatternEntry } from "@repo/tirads-acr";

import { branding } from "../../../config/branding";
import type { RootStackParamList } from "../../../navigation/paramLists";
import { theme } from "../../../theme";
import TiradsAiPanel from "../components/TiradsAiPanel";
import TiradsAcrPanel from "../components/TiradsAcrPanel";
import TiradsPatternPanel from "../components/TiradsPatternPanel";
import TiradsRuPanel from "../components/TiradsRuPanel";
import ThyroidTopographyPanel from "../components/ThyroidTopographyPanel";
import type { ThyroidAiAssistResult } from "../ai/thyroidAiService";
import { mapTiradsToSreInput } from "../../../reporting/mapTiradsToSreInput";
import {
  applyAiResultToMobileInput,
  applyPatternToMobileInput,
  defaultTiradsInput,
  TI_RADS_VERSION,
  type TiradsInput,
} from "../logic/tiradsCalculator";

type Props = NativeStackScreenProps<RootStackParamList, "TiRadsAssistant">;
type System = "ru" | "acr" | "patterns" | "assistant" | "map";

export default function TiRadsAssistantScreen({ navigation }: Props) {
  const [system, setSystem] = useState<System>("acr");
  const [learnMode, setLearnMode] = useState(false);
  const [acrInput, setAcrInput] = useState<TiradsInput>({ ...defaultTiradsInput });
  const [sizeText, setSizeText] = useState("");
  const [patternSource, setPatternSource] = useState<string | null>(null);

  function applyPattern(pattern: ThyroidPatternEntry) {
    setAcrInput(applyPatternToMobileInput(pattern.id));
    setPatternSource(pattern.nameRu);
    setSystem("acr");
  }

  function applyFromAi(result: ThyroidAiAssistResult) {
    const applied = applyAiResultToMobileInput(result.parsedInput);
    setAcrInput(applied.input);
    setSizeText(applied.sizeText);
    setPatternSource(result.suggestedDiagnosis);
    setSystem("acr");
  }

  async function copyReport(text: string) {
    await Clipboard.setStringAsync(text);
    Alert.alert("Скопировано", "Заключение ACR TI-RADS в буфере обмена.");
  }

  function openStructuredReport() {
    const sizeMm = sizeText.trim() ? Number(sizeText.replace(",", ".")) : undefined;
    navigation.navigate("StructuredReportPreview", {
      domain: "thyroid",
      thyroidInput: mapTiradsToSreInput(acrInput, Number.isFinite(sizeMm) ? sizeMm : undefined),
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable style={styles.back} onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>TI-RADS US</Text>
          <Text style={styles.version} numberOfLines={1}>
            {system === "ru"
              ? "РФ 2023 · Катрич и др."
              : system === "patterns"
                ? "Pattern Recognition · ACR"
                : system === "assistant"
                  ? "AI Assistant · ACR TI-RADS"
                  : system === "map"
                    ? "Карта ЩЖ · локализация узла"
                  : `${TI_RADS_VERSION} · ACR`}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.toggleRow}>
        <Pressable style={[styles.toggle, system === "acr" && styles.toggleOnAcr]} onPress={() => setSystem("acr")}>
          <Text style={[styles.toggleText, system === "acr" && styles.toggleTextOnAcr]}>ACR Score</Text>
        </Pressable>
        <Pressable style={[styles.toggle, system === "patterns" && styles.toggleOnAcr]} onPress={() => setSystem("patterns")}>
          <Text style={[styles.toggleText, system === "patterns" && styles.toggleTextOnAcr]}>Patterns</Text>
        </Pressable>
        <Pressable style={[styles.toggle, system === "assistant" && styles.toggleOnAcr]} onPress={() => setSystem("assistant")}>
          <Text style={[styles.toggleText, system === "assistant" && styles.toggleTextOnAcr]}>AI</Text>
        </Pressable>
        <Pressable style={[styles.toggle, system === "map" && styles.toggleOnAcr]} onPress={() => setSystem("map")}>
          <Text style={[styles.toggleText, system === "map" && styles.toggleTextOnAcr]}>Карта</Text>
        </Pressable>
        <Pressable style={[styles.toggle, system === "ru" && styles.toggleOn]} onPress={() => setSystem("ru")}>
          <Text style={[styles.toggleText, system === "ru" && styles.toggleTextOn]}>TI-RADS РФ</Text>
        </Pressable>
        {system === "ru" ? (
          <Pressable style={[styles.toggle, learnMode && styles.toggleOn]} onPress={() => setLearnMode((v) => !v)}>
            <Text style={[styles.toggleText, learnMode && styles.toggleTextOn]}>Обучение</Text>
          </Pressable>
        ) : null}
      </View>

      {system === "patterns" ? (
        <View style={styles.patternsWrap}>
          <TiradsPatternPanel onApply={applyPattern} />
        </View>
      ) : system === "assistant" ? (
        <View style={styles.patternsWrap}>
          <TiradsAiPanel onApply={applyFromAi} />
        </View>
      ) : system === "map" ? (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <ThyroidTopographyPanel />
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {system === "ru" ? (
            <TiradsRuPanel learnMode={learnMode} />
          ) : (
            <TiradsAcrPanel
              input={acrInput}
              onInputChange={(next) => {
                setAcrInput(next);
                setPatternSource(null);
              }}
              sizeText={sizeText}
              onSizeTextChange={setSizeText}
              patternSource={patternSource}
              onCopyReport={(t) => void copyReport(t)}
              onOpenStructuredReport={openStructuredReport}
            />
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: branding.colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
    backgroundColor: "#fff",
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  backText: { fontSize: 18, color: theme.colors.text, fontWeight: "600" },
  headerCenter: { flex: 1, alignItems: "center" },
  title: { fontSize: 17, fontWeight: "800", color: branding.colors.text },
  version: { fontSize: 10, color: branding.colors.textSecondary, marginTop: 2, paddingHorizontal: 8 },
  headerSpacer: { width: 40 },
  toggleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  toggle: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  toggleOn: { borderColor: "#0284c7", backgroundColor: "#e0f2fe" },
  toggleOnAcr: { borderColor: "#0d9488", backgroundColor: "#ecfdf5" },
  toggleText: { fontSize: 12, fontWeight: "700", color: "#64748b" },
  toggleTextOn: { color: "#0369a1" },
  toggleTextOnAcr: { color: "#0f766e" },
  scroll: { padding: theme.spacing.md, paddingBottom: 36 },
  patternsWrap: { flex: 1, paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.md },
});
