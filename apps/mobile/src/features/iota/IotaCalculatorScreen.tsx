import {
  calculateAdnex,
  calculateLr2,
  calculateSimpleRulesRisk,
  compareIotaRiskWithOrads,
  evaluateSimpleRules,
  type AdnexInput,
  type SimpleRulesFeature,
} from "@repo/iota-models";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import SelectChip from "../oradsPro/components/SelectChip";
import StepCard from "../oradsPro/components/StepCard";
import type { RootStackParamList } from "../../navigation/AppStack";

type Props = NativeStackScreenProps<RootStackParamList, "IotaCalculator">;

const B_LIST: SimpleRulesFeature[] = ["B1", "B2", "B3", "B4", "B5"];
const M_LIST: SimpleRulesFeature[] = ["M1", "M2", "M3", "M4", "M5"];

function pct(v: number) {
  return `${(v * 100).toFixed(1)}%`;
}

export default function IotaCalculatorScreen({ route, navigation }: Props) {
  const prefill = route.params?.prefill;
  const oradsFromRoute = route.params?.oradsCategory ?? null;

  const [ageYears, setAgeYears] = useState(String(prefill?.ageYears ?? 45));
  const [oncologyCenter, setOncologyCenter] = useState(prefill?.oncologyCenter ?? false);
  const [maxDiameterMm, setMaxDiameterMm] = useState(
    prefill?.maxDiameterMm != null ? String(prefill.maxDiameterMm) : "",
  );
  const [maxSolidMm, setMaxSolidMm] = useState(String(prefill?.maxSolidDiameterMm ?? "0"));
  const [moreThan10Locules, setMoreThan10Locules] = useState(prefill?.moreThan10Locules ?? false);
  const [papillaryCount, setPapillaryCount] = useState<AdnexInput["papillaryCount"]>(
    prefill?.papillaryCount ?? 0,
  );
  const [acousticShadows, setAcousticShadows] = useState(prefill?.acousticShadows ?? false);
  const [ascites, setAscites] = useState(prefill?.ascites ?? false);
  const [useCa125, setUseCa125] = useState(prefill?.ca125Uml != null);
  const [ca125Uml, setCa125Uml] = useState(prefill?.ca125Uml != null ? String(prefill.ca125Uml) : "");
  const [benign, setBenign] = useState<SimpleRulesFeature[]>([]);
  const [malignant, setMalignant] = useState<SimpleRulesFeature[]>([]);
  const [irregularWalls, setIrregularWalls] = useState(false);
  const [bloodFlowPapillary, setBloodFlowPapillary] = useState(false);

  const adnexPayload = useMemo(
    (): Partial<AdnexInput> => ({
      ageYears: Number.parseInt(ageYears, 10),
      oncologyCenter,
      maxDiameterMm: Number.parseFloat(maxDiameterMm),
      maxSolidDiameterMm: Number.parseFloat(maxSolidMm),
      moreThan10Locules,
      papillaryCount,
      acousticShadows,
      ascites,
      ca125Uml: useCa125 ? Number.parseFloat(ca125Uml) : undefined,
    }),
    [
      ageYears,
      oncologyCenter,
      maxDiameterMm,
      maxSolidMm,
      moreThan10Locules,
      papillaryCount,
      acousticShadows,
      ascites,
      useCa125,
      ca125Uml,
    ],
  );

  const adnex = useMemo(() => calculateAdnex(adnexPayload), [adnexPayload]);
  const simple = useMemo(() => evaluateSimpleRules({ benignFeatures: benign, malignantFeatures: malignant }), [benign, malignant]);
  const srr = useMemo(
    () => calculateSimpleRulesRisk({ oncologyCenter, benignFeatures: benign, malignantFeatures: malignant }),
    [oncologyCenter, benign, malignant],
  );
  const lr2 = useMemo(
    () =>
      calculateLr2({
        ageYears: Number.parseInt(ageYears, 10),
        ascites,
        bloodFlowInSolidPapillary: bloodFlowPapillary,
        maxSolidDiameterMm: Number.parseFloat(maxSolidMm) || 0,
        irregularInternalWalls: irregularWalls,
        acousticShadows,
      }),
    [ageYears, ascites, bloodFlowPapillary, maxSolidMm, irregularWalls, acousticShadows],
  );

  const compare =
    "malignancyRisk" in adnex && oradsFromRoute != null
      ? compareIotaRiskWithOrads(adnex.malignancyRisk, { categoryNumber: oradsFromRoute })
      : null;

  function toggle(list: SimpleRulesFeature[], code: SimpleRulesFeature, set: (v: SimpleRulesFeature[]) => void) {
    set(list.includes(code) ? list.filter((c) => c !== code) : [...list, code]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Назад</Text>
        </Pressable>
        <Text style={styles.title}>IOTA · ADNEX</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.disclaimer}>
          Детерминированные модели IOTA (assistive). Не диагноз; решение — за специалистом.
        </Text>

        <StepCard title="ADNEX">
          <Text style={styles.sub}>Возраст (лет)</Text>
          <TextInput style={styles.input} keyboardType="number-pad" value={ageYears} onChangeText={setAgeYears} />
          <Text style={styles.sub}>Макс. диаметр (мм)</Text>
          <TextInput style={styles.input} keyboardType="decimal-pad" value={maxDiameterMm} onChangeText={setMaxDiameterMm} />
          <Text style={styles.sub}>Макс. солидный (мм)</Text>
          <TextInput style={styles.input} keyboardType="decimal-pad" value={maxSolidMm} onChangeText={setMaxSolidMm} />
          <View style={styles.rowWrap}>
            <SelectChip label="CA-125 в ADNEX" selected={useCa125} onPress={() => setUseCa125((v) => !v)} />
          </View>
          {useCa125 ? (
            <>
              <Text style={styles.sub}>CA-125 (Ед/мл)</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={ca125Uml}
                onChangeText={setCa125Uml}
                accessibilityLabel="Уровень CA-125"
              />
            </>
          ) : null}
          <View style={styles.rowWrap}>
            <SelectChip label="Онкоцентр" selected={oncologyCenter} onPress={() => setOncologyCenter(true)} />
            <SelectChip label="Другой центр" selected={!oncologyCenter} onPress={() => setOncologyCenter(false)} />
            <SelectChip label=">10 камер" selected={moreThan10Locules} onPress={() => setMoreThan10Locules((v) => !v)} />
            <SelectChip label="Тень" selected={acousticShadows} onPress={() => setAcousticShadows((v) => !v)} />
            <SelectChip label="Асцит" selected={ascites} onPress={() => setAscites((v) => !v)} />
          </View>
          <Text style={styles.sub}>Папилляры (≥3 мм)</Text>
          <View style={styles.rowWrap}>
            {([0, 1, 2, 3, "4plus"] as const).map((p) => (
              <SelectChip
                key={String(p)}
                label={p === "4plus" ? "≥4" : String(p)}
                selected={papillaryCount === p}
                onPress={() => setPapillaryCount(p)}
              />
            ))}
          </View>
        </StepCard>

        <StepCard title="Simple Rules B / M">
          <View style={styles.rowWrap}>
            {B_LIST.map((c) => (
              <SelectChip key={c} label={c} selected={benign.includes(c)} onPress={() => toggle(benign, c, setBenign)} />
            ))}
          </View>
          <View style={styles.rowWrap}>
            {M_LIST.map((c) => (
              <SelectChip key={c} label={c} selected={malignant.includes(c)} onPress={() => toggle(malignant, c, setMalignant)} />
            ))}
          </View>
          <View style={styles.rowWrap}>
            <SelectChip label="Неровные стенки (LR2)" selected={irregularWalls} onPress={() => setIrregularWalls((v) => !v)} />
            <SelectChip label="Кровоток (LR2)" selected={bloodFlowPapillary} onPress={() => setBloodFlowPapillary((v) => !v)} />
          </View>
        </StepCard>

        {"errors" in adnex ? (
          <Text style={styles.warn}>Проверьте поля ADNEX (возраст 18–100, диаметры в мм).</Text>
        ) : (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>ADNEX · риск ЗНО</Text>
            <Text style={styles.resultBig}>{pct(adnex.malignancyRisk)}</Text>
            {"malignancyRisk" in srr ? <Text style={styles.resultLine}>Simple Rules Risk: {pct(srr.malignancyRisk)}</Text> : null}
            {"malignancyRisk" in lr2 ? <Text style={styles.resultLine}>LR2: {pct(lr2.malignancyRisk)}</Text> : null}
            {"verdict" in simple ? <Text style={styles.resultLine}>Simple Rules: {simple.verdict}</Text> : null}
            {oradsFromRoute != null ? (
              <Text style={styles.resultLine}>O-RADS US: {oradsFromRoute}</Text>
            ) : null}
            {compare ? (
              <Text style={styles.compare}>{compare.status.replaceAll("_", " ")}</Text>
            ) : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FB" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  back: { color: "#2563EB", fontWeight: "700" },
  title: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  content: { padding: 14, gap: 12, paddingBottom: 40 },
  disclaimer: { color: "#64748b", fontSize: 12, lineHeight: 17 },
  sub: { color: "#475569", fontSize: 12, fontWeight: "700", marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
    marginTop: 4,
  },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  warn: { color: "#b45309", fontSize: 13, padding: 12, backgroundColor: "#fffbeb", borderRadius: 12 },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  resultTitle: { fontWeight: "800", color: "#0f172a" },
  resultBig: { fontSize: 28, fontWeight: "900", color: "#0ea5e9", marginVertical: 8 },
  resultLine: { color: "#334155", fontSize: 14, marginTop: 4 },
  compare: { marginTop: 10, color: "#475569", fontSize: 13 },
});
