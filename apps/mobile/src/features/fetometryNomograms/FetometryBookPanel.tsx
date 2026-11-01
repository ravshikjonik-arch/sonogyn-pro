import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  DOPPLER_FIELDS,
  EXTENDED_FIELDS,
  HEART_FIELDS,
  MEDVEDEV_BOOK_DISCLAIMER,
  POPULATION_OPTIONS,
  T1_PANEL_FIELDS,
  T2_BASE_FIELDS,
  evaluateFetometryPanel,
  remapMeasurementIdsForPopulation,
  type FetometryPopulation,
  type FetometrySection,
  type PanelField,
} from "@repo/fetal-nomograms";

type TabId = "t1" | "t2_base" | "extended" | "heart" | "doppler";

const TABS: { id: TabId; label: string }[] = [
  { id: "t1", label: "I тр." },
  { id: "t2_base", label: "II–III" },
  { id: "extended", label: "Расшир." },
  { id: "heart", label: "Сердце" },
  { id: "doppler", label: "Допплер" },
];

const FIELDS: Record<TabId, PanelField[]> = {
  t1: T1_PANEL_FIELDS,
  t2_base: T2_BASE_FIELDS,
  extended: EXTENDED_FIELDS,
  heart: HEART_FIELDS,
  doppler: DOPPLER_FIELDS,
};

export function FetometryBookPanel() {
  const [tab, setTab] = useState<TabId>("t1");
  const [gaWeeks, setGaWeeks] = useState("12");
  const [gaDays, setGaDays] = useState("0");
  const [crlMm, setCrlMm] = useState("55");
  const [bpdMm, setBpdMm] = useState("");
  const [population, setPopulation] = useState<FetometryPopulation>("moscow");
  const [values, setValues] = useState<Record<string, string>>({});

  const fields = FIELDS[tab];

  const panel = useMemo(() => {
    const weeks = Number(gaWeeks);
    const days = Number(gaDays);
    const crl = crlMm.trim() === "" ? undefined : Number(crlMm.replace(",", "."));
    const bpd = bpdMm.trim() === "" ? undefined : Number(bpdMm.replace(",", "."));
    if (!Number.isFinite(weeks)) return null;

    const measurements: Record<string, number | null> = {};
    for (const f of fields) {
      const raw = values[f.id];
      if (raw == null || raw.trim() === "") continue;
      const n = Number(raw.replace(",", "."));
      if (!Number.isFinite(n)) continue;
      measurements[f.id] = n;
    }
    if (!Object.keys(measurements).length) return null;

    const remapped =
      tab === "t2_base" ? remapMeasurementIdsForPopulation(measurements, population) : measurements;

    return evaluateFetometryPanel({
      ctx: {
        gaWeeks: weeks,
        gaDays: Number.isFinite(days) ? days : 0,
        crlMm: crl != null && Number.isFinite(crl) ? crl : undefined,
        bpdMm: bpd != null && Number.isFinite(bpd) ? bpd : undefined,
        population,
      },
      measurements: remapped,
      section: tab as FetometrySection,
      population,
    });
  }, [tab, gaWeeks, gaDays, crlMm, bpdMm, population, values, fields]);

  return (
    <View style={styles.wrap}>
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setTab(t.id)}
            style={[styles.tab, tab === t.id && styles.tabActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.id }}
          >
            <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Срок (нед + дни)</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={gaWeeks}
          onChangeText={setGaWeeks}
          accessibilityLabel="Срок недели"
        />
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={gaDays}
          onChangeText={setGaDays}
          accessibilityLabel="Срок дни"
        />
      </View>
      <Text style={styles.label}>КТР / БПР (мм)</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={crlMm}
          onChangeText={setCrlMm}
          accessibilityLabel="КТР"
        />
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={bpdMm}
          onChangeText={setBpdMm}
          placeholder="БПР"
          accessibilityLabel="БПР"
        />
      </View>

      {tab === "t2_base" ? (
        <View style={styles.popRow}>
          {POPULATION_OPTIONS.map((o) => (
            <Pressable
              key={o.id}
              onPress={() => setPopulation(o.id)}
              style={[styles.popChip, population === o.id && styles.popChipActive]}
            >
              <Text style={[styles.popText, population === o.id && styles.popTextActive]}>{o.labelRu}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {fields.map((f) => (
        <View key={f.id} style={styles.field}>
          <Text style={styles.label}>
            {f.labelRu} ({f.unit})
          </Text>
          <TextInput
            style={styles.inputWide}
            keyboardType="decimal-pad"
            value={values[f.id] ?? ""}
            onChangeText={(v) => setValues((prev) => ({ ...prev, [f.id]: v }))}
            accessibilityLabel={f.labelRu}
          />
        </View>
      ))}

      {panel ? (
        <View style={styles.results}>
          <Text style={styles.summary}>
            ниже {panel.summary.below} · норма {panel.summary.normal} · выше {panel.summary.above}
            {panel.summary.momAlert ? ` · MoM ${panel.summary.momAlert}` : ""}
          </Text>
          {panel.results.map((r) => (
            <View key={r.id} style={styles.resultCard}>
              <Text style={styles.resultTitle}>
                {r.titleRu}: {String(r.value)} {r.unit}
              </Text>
              <Text style={styles.resultZone}>{r.zoneLabelRu}</Text>
              {r.nearestPercentileHint ? <Text style={styles.hint}>{r.nearestPercentileHint}</Text> : null}
            </View>
          ))}
          <Text style={styles.disclaimer}>{MEDVEDEV_BOOK_DISCLAIMER}</Text>
        </View>
      ) : (
        <Text style={styles.hint}>Введите срок и хотя бы одно измерение.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tab: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  tabActive: { backgroundColor: "#0F2744", borderColor: "#0F2744" },
  tabText: { fontSize: 11, fontWeight: "700", color: "#334155" },
  tabTextActive: { color: "#fff" },
  label: { fontSize: 12, fontWeight: "700", color: "#475569" },
  row: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  inputWide: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  field: { gap: 4 },
  popRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  popChip: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  popChipActive: { borderColor: "#0d9488", backgroundColor: "#ccfbf1" },
  popText: { fontSize: 11, fontWeight: "600", color: "#334155" },
  popTextActive: { color: "#0f766e" },
  results: { gap: 8, marginTop: 8 },
  summary: { fontSize: 13, fontWeight: "700", color: "#0F2744" },
  resultCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fff",
    gap: 4,
  },
  resultTitle: { fontSize: 14, fontWeight: "700", color: "#0F2744" },
  resultZone: { fontSize: 13, fontWeight: "600", color: "#0d9488" },
  hint: { fontSize: 12, color: "#64748b" },
  disclaimer: {
    fontSize: 11,
    lineHeight: 16,
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    padding: 10,
    borderRadius: 10,
  },
});
