import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  NOMOGRAM_CATEGORY_LABELS,
  NOMOGRAM_DECISION_TREE,
  NOMOGRAM_DISCLAIMER,
  NOMOGRAM_WIZARD_START,
  buildDecisionTreePath,
  buildNomogramChartSeries,
  evaluateNomogram,
  evaluateTrisomyScore,
  listClinicalDefinitions,
  listNomogramsByCategory,
  nextInputStepForNomogram,
  type Nomogram,
  type NomogramCategory,
  type NomogramDecisionNodeId,
} from "@repo/fetal-nomograms";

import StepCard from "../oradsPro/components/StepCard";
import { NOMOGRAM_FLAG_LABELS } from "./flagLabels";
import { NomogramChartSvg } from "./NomogramChartSvg";

export function NomogramWizardPanel() {
  const [step, setStep] = useState<NomogramDecisionNodeId>(NOMOGRAM_WIZARD_START);
  const [category, setCategory] = useState<NomogramCategory | null>(null);
  const [nomogram, setNomogram] = useState<Nomogram | null>(null);
  const [gaWeeks, setGaWeeks] = useState("20");
  const [gaDays, setGaDays] = useState("0");
  const [crlMm, setCrlMm] = useState("");
  const [value, setValue] = useState("");
  const [trisomySelected, setTrisomySelected] = useState<string[]>([]);

  const node = NOMOGRAM_DECISION_TREE[step];
  const nomogramsInCategory = useMemo(
    () => (category ? listNomogramsByCategory(category) : []),
    [category],
  );

  const gaWeeksDecimal = useMemo(() => {
    const w = Number.parseInt(gaWeeks, 10);
    const d = Number.parseInt(gaDays, 10);
    if (!Number.isFinite(w)) return undefined;
    return w + (Number.isFinite(d) ? d / 7 : 0);
  }, [gaWeeks, gaDays]);

  const measureValue = useMemo(() => {
    const v = Number.parseFloat(value.replace(",", "."));
    return Number.isFinite(v) ? v : undefined;
  }, [value]);

  const crl = useMemo(() => {
    const v = Number.parseFloat(crlMm.replace(",", "."));
    return Number.isFinite(v) ? v : undefined;
  }, [crlMm]);

  const nomogramResult = useMemo(() => {
    if (step !== "enter_value" || !nomogram || measureValue == null) return null;
    return evaluateNomogram({
      nomogramId: nomogram.id,
      gaWeeksDecimal: nomogram.x_axis.type !== "crl_range_mm" ? gaWeeksDecimal : undefined,
      crlMm: nomogram.x_axis.type === "crl_range_mm" ? crl : undefined,
      value: measureValue,
    });
  }, [step, nomogram, measureValue, gaWeeksDecimal, crl]);

  const trisomyResult = useMemo(() => {
    if (step !== "trisomy_score") return null;
    return evaluateTrisomyScore({ selectedSigns: trisomySelected });
  }, [step, trisomySelected]);

  const chartSeries = useMemo(() => (nomogram ? buildNomogramChartSeries(nomogram.id) : null), [nomogram]);

  const chartMarker = useMemo(() => {
    if (!nomogram || measureValue == null) return undefined;
    if (nomogram.x_axis.type === "crl_range_mm") {
      return crl != null ? { x: crl, y: measureValue } : undefined;
    }
    return gaWeeksDecimal != null ? { x: gaWeeksDecimal, y: measureValue } : undefined;
  }, [nomogram, measureValue, gaWeeksDecimal, crl]);

  const clinicalDefs = useMemo(() => listClinicalDefinitions(), []);

  const treePath = useMemo(() => {
    if (step === "trisomy_score" && trisomyResult?.ok) {
      return buildDecisionTreePath({ categoryLabel: "Риск трисомий", resultSummary: trisomyResult.summary });
    }
    return buildDecisionTreePath({
      categoryLabel: category ? NOMOGRAM_CATEGORY_LABELS[category] : undefined,
      nomogramTitle: nomogram?.title,
      gaLabel:
        nomogram?.x_axis.type === "crl_range_mm"
          ? crl != null
            ? `КТР ${crl} мм`
            : undefined
          : gaWeeksDecimal != null
            ? `${gaWeeksDecimal.toFixed(2)} нед`
            : undefined,
      valueLabel: measureValue != null ? `${measureValue} ${nomogram?.unit ?? ""}` : undefined,
      resultSummary: nomogramResult?.summary,
    });
  }, [category, nomogram, gaWeeksDecimal, crl, measureValue, nomogramResult, step, trisomyResult]);

  function resetWizard() {
    setStep(NOMOGRAM_WIZARD_START);
    setCategory(null);
    setNomogram(null);
    setTrisomySelected([]);
    setValue("");
  }

  function pickCategory(cat: NomogramCategory) {
    setCategory(cat);
    setNomogram(null);
    setStep("pick_nomogram");
  }

  function pickNomogram(n: Nomogram) {
    setNomogram(n);
    setStep(nextInputStepForNomogram(n.x_axis.type));
  }

  function toggleTrisomy(sign: string) {
    setTrisomySelected((prev) => (prev.includes(sign) ? prev.filter((s) => s !== sign) : [...prev, sign]));
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.disclaimer}>{NOMOGRAM_DISCLAIMER}</Text>
      <StepCard title="Дерево решений · номограммы">
        {treePath.map((line) => (
          <Text key={line} style={styles.pathLine}>
            • {line}
          </Text>
        ))}
        <Text style={styles.question}>{node.questionRu}</Text>
        {node.helpRu ? <Text style={styles.help}>{node.helpRu}</Text> : null}

        {step === "start_category" && node.options ? (
          <View style={styles.optionGrid}>
            {node.options.map((opt) => (
              <Pressable
                key={opt.id}
                style={({ pressed }) => [styles.optionBtn, pressed && styles.optionPressed]}
                onPress={() => {
                  if (opt.category) pickCategory(opt.category);
                  else if (opt.next === "trisomy_score") setStep("trisomy_score");
                }}
              >
                <Text style={styles.optionText}>{opt.labelRu}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {step === "pick_nomogram" && category ? (
          <View style={styles.list}>
            {nomogramsInCategory.map((n) => (
              <Pressable
                key={n.id}
                style={[styles.listItem, nomogram?.id === n.id && styles.listItemActive]}
                onPress={() => pickNomogram(n)}
              >
                <Text style={styles.listTitle}>{n.title}</Text>
                <Text style={styles.listSub}>
                  {n.key} · {n.unit}
                  {n.source ? ` · ${n.source}` : ""}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {(step === "enter_ga" || step === "enter_crl") && nomogram ? (
          <View style={styles.form}>
            <Text style={styles.badge}>{nomogram.title}</Text>
            {step === "enter_ga" ? (
              <View style={styles.row}>
                <View style={styles.field}>
                  <Text style={styles.label}>Недели</Text>
                  <TextInput style={styles.input} keyboardType="number-pad" value={gaWeeks} onChangeText={setGaWeeks} />
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>Дни</Text>
                  <TextInput style={styles.input} keyboardType="number-pad" value={gaDays} onChangeText={setGaDays} />
                </View>
              </View>
            ) : (
              <View style={styles.field}>
                <Text style={styles.label}>КТР, мм</Text>
                <TextInput style={styles.input} keyboardType="decimal-pad" value={crlMm} onChangeText={setCrlMm} />
              </View>
            )}
            <Pressable style={styles.primaryBtn} onPress={() => setStep("enter_value")}>
              <Text style={styles.primaryBtnText}>К вводу замера</Text>
            </Pressable>
          </View>
        ) : null}

        {step === "enter_value" && nomogram ? (
          <View style={styles.form}>
            <Text style={styles.badge}>{nomogram.title}</Text>
            <View style={styles.field}>
              <Text style={styles.label}>Значение, {nomogram.unit}</Text>
              <TextInput style={styles.input} keyboardType="decimal-pad" value={value} onChangeText={setValue} />
            </View>
            {nomogramResult ? (
              <View style={[styles.result, nomogramResult.ok ? styles.resultOk : styles.resultWarn]}>
                <Text style={styles.resultTitle}>{NOMOGRAM_FLAG_LABELS[nomogramResult.flag] ?? nomogramResult.flag}</Text>
                <Text style={styles.resultBody}>{nomogramResult.summary}</Text>
                {nomogramResult.interpolated?.p5 != null ? (
                  <Text style={styles.resultMeta}>
                    {nomogramResult.percentileLabels?.low ?? "p5"} {nomogramResult.interpolated.p5} · p50{" "}
                    {nomogramResult.interpolated.p50} · {nomogramResult.percentileLabels?.high ?? "p95"}{" "}
                    {nomogramResult.interpolated.p95}
                  </Text>
                ) : null}
                {nomogramResult.source ? <Text style={styles.resultMeta}>Источник: {nomogramResult.source}</Text> : null}
                {chartSeries && chartMarker ? (
                  <NomogramChartSvg series={chartSeries} markerX={chartMarker.x} markerY={chartMarker.y} />
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}

        {step === "trisomy_score" && trisomyResult ? (
          <View style={styles.form}>
            {trisomyResult.items.map((item) => (
              <Pressable key={item.sign} style={styles.checkRow} onPress={() => toggleTrisomy(item.sign)}>
                <Text style={styles.checkBox}>{item.selected ? "☑" : "☐"}</Text>
                <Text style={styles.checkLabel}>
                  {item.sign} (+{item.score})
                </Text>
              </Pressable>
            ))}
            <View style={[styles.result, trisomyResult.recommendKaryotyping ? styles.resultWarn : styles.resultOk]}>
              <Text style={styles.resultTitle}>
                Сумма: {trisomyResult.totalScore} (порог {trisomyResult.threshold})
              </Text>
              <Text style={styles.resultBody}>{trisomyResult.summary}</Text>
            </View>
            {clinicalDefs.length ? (
              <Text style={styles.help}>Определения: {clinicalDefs.map((d) => d.term).join(", ")}</Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.actions}>
          {step !== NOMOGRAM_WIZARD_START ? (
            <Pressable style={styles.secondaryBtn} onPress={resetWizard}>
              <Text style={styles.secondaryBtnText}>Сначала</Text>
            </Pressable>
          ) : null}
        </View>
      </StepCard>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  disclaimer: { fontSize: 11, color: "#5C6B7A", lineHeight: 16 },
  pathLine: { fontSize: 11, color: "#64748b", lineHeight: 16 },
  question: { fontSize: 15, fontWeight: "700", color: "#0F2744" },
  help: { fontSize: 12, color: "#64748b", lineHeight: 18 },
  optionGrid: { gap: 8 },
  optionBtn: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
  },
  optionPressed: { opacity: 0.85 },
  optionText: { fontSize: 14, color: "#0F2744", fontWeight: "600" },
  list: { gap: 6, maxHeight: 280 },
  listItem: { borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#fff" },
  listItemActive: { borderColor: "#0d9488", backgroundColor: "#f0fdfa" },
  listTitle: { fontSize: 14, fontWeight: "700", color: "#0F2744" },
  listSub: { fontSize: 11, color: "#64748b", marginTop: 2 },
  form: { gap: 10 },
  badge: { fontSize: 12, fontWeight: "700", color: "#0d9488" },
  row: { flexDirection: "row", gap: 10 },
  field: { flex: 1, gap: 4 },
  label: { fontSize: 12, fontWeight: "600", color: "#334155" },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  primaryBtn: { backgroundColor: "#0F2744", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  result: { borderRadius: 12, padding: 12, borderWidth: 1, gap: 6 },
  resultOk: { borderColor: "#6ee7b7", backgroundColor: "#ecfdf5" },
  resultWarn: { borderColor: "#fcd34d", backgroundColor: "#fffbeb" },
  resultTitle: { fontWeight: "800", color: "#0F2744" },
  resultBody: { fontSize: 13, color: "#334155", lineHeight: 18 },
  resultMeta: { fontSize: 11, color: "#64748b" },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingVertical: 4 },
  checkBox: { fontSize: 16, width: 22 },
  checkLabel: { flex: 1, fontSize: 13, color: "#334155" },
  actions: { flexDirection: "row", gap: 8, marginTop: 4 },
  secondaryBtn: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  secondaryBtnText: { color: "#334155", fontWeight: "600" },
});
