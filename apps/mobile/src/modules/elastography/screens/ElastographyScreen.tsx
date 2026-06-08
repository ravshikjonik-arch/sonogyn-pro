import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PRODUCT } from "../../../config/product";
import i18n from "../../../i18n";
import type { RootStackParamList } from "../../../navigation/paramLists";
import InputForm from "../components/InputForm";
import MethodSelector from "../components/MethodSelector";
import OrganSelector from "../components/OrganSelector";
import ResultView from "../components/ResultView";
import { ConfigStatusBadge, REFERENCE_TABLE } from "../constants";
import { useElastography } from "../hooks/useElastography";
import { attachElastographyI18n } from "../i18nStrings";
import type { ElastographyReferenceRow } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "ElastographyCalc">;

const STEP_TITLE: Record<string, string> = {
  organ: "elasto_step_organ",
  method: "elasto_step_method",
  input: "elasto_step_input",
  result: "elasto_step_result",
};

export default function ElastographyScreen({ navigation }: Props) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  const el = useElastography();

  useEffect(() => {
    attachElastographyI18n(i18n as unknown as { translations: Record<string, Record<string, string>> });
  }, []);

  const scaleRange = useMemo(() => {
    if (el.organ === "cervix") return { min: 0, max: 1 };
    if (el.organ === "myometrium") return { min: 0.5, max: 3 };
    if (el.organ === "ovary") return { min: 0, max: 8 };
    if (el.organ === "breast") return { min: 0, max: 200 };
    return { min: 0, max: 1 };
  }, [el.organ]);

  async function onSave() {
    const ok = await el.saveToHistory();
    Alert.alert(ok ? el.t("elasto_history_saved") : el.t("elasto_history_error"));
  }

  return (
    <SafeAreaView style={[styles.safe, isDark && styles.safeDark]} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Pressable onPress={() => (el.step === "organ" ? navigation.goBack() : el.goBack())} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#6D28D9" />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={[styles.kicker, isDark && styles.textDarkMuted]}>{PRODUCT.fullName}</Text>
          <Text style={[styles.title, isDark && styles.textDark]}>{el.t("elasto_title")}</Text>
          <Text style={styles.sub}>{el.t(STEP_TITLE[el.step] ?? "elasto_step_organ")}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {el.step === "organ" ? (
          <OrganSelector t={el.t} selected={el.organ} onSelect={el.selectOrgan} />
        ) : null}

        {el.step === "method" ? (
          <MethodSelector t={el.t} methods={el.availableMethods} selected={el.method} onSelect={el.selectMethod} />
        ) : null}

        {el.step === "input" ? (
          <InputForm
            t={el.t}
            fields={el.fields}
            values={el.values}
            onChange={el.setField}
            onCalculate={el.calculate}
            errors={el.validationErrors}
            warnings={el.warnings}
            patientId={el.patientId}
            patientName={el.patientName}
            onPatientId={el.setPatientId}
            onPatientName={el.setPatientName}
            organExtras={
              el.organ === "myometrium"
                ? { myometriumType: el.myometriumType, onMyometriumType: el.setMyometriumType }
                : el.organ === "ovary"
                  ? { ovaryIotaType: el.ovaryIotaType, onOvaryIotaType: el.setOvaryIotaType }
                  : undefined
            }
          />
        ) : null}

        {el.step === "result" && el.result ? (
          <>
            <ResultView
              t={el.t}
              result={el.result}
              currentEntry={el.getCurrentHistoryEntry()}
              scaleMin={scaleRange.min}
              scaleMax={scaleRange.max}
              onBack={el.goBack}
              onSave={onSave}
            />
            <ConfigStatusBadge />
          </>
        ) : null}

        {el.step !== "result" ? (
          <View style={styles.refBlock}>
            <Text style={styles.refTitle}>{el.t("elasto_reference")}</Text>
            {REFERENCE_TABLE.slice(0, 3).map((row: ElastographyReferenceRow) => (
              <Text key={row.organ + row.parameter} style={styles.refRow}>
                {row.parameter}: {row.lowRisk} / {row.intermediate} / {row.highRisk}
              </Text>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F9FB" },
  safeDark: { backgroundColor: "#0f172a" },
  header: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: 12, paddingBottom: 8, gap: 4 },
  backBtn: { padding: 8, marginTop: 4 },
  headerText: { flex: 1, paddingRight: 12 },
  kicker: { fontSize: 10, fontWeight: "700", color: "#6D28D9", letterSpacing: 1 },
  title: { fontSize: 24, fontWeight: "800", color: "#0F2744" },
  sub: { fontSize: 13, color: "#64748b", marginTop: 4 },
  textDark: { color: "#f1f5f9" },
  textDarkMuted: { color: "#a78bfa" },
  scroll: { padding: 16, paddingBottom: 40, gap: 16 },
  refBlock: {
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E8EDF2",
    gap: 6,
  },
  refTitle: { fontSize: 12, fontWeight: "800", color: "#475569", textTransform: "uppercase" },
  refRow: { fontSize: 11, color: "#64748b", lineHeight: 16 },
});
