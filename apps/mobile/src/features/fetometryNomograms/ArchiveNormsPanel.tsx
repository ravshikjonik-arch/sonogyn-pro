import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import {
  ARCHIVE_CALCULATOR_DISCLAIMER,
  evaluateArchiveNorm,
  listArchiveCalculatorCards,
  listArchiveTableParameters,
  medvedevArchiveBookStats,
  type ArchiveCalculatorCard,
} from "@repo/medvedev-reference";

import StepCard from "../oradsPro/components/StepCard";
import { ARCHIVE_FLAG_LABELS } from "./flagLabels";

const BLOCK_LABELS: Record<string, string> = {
  early_dating: "Малый срок",
  screening_i: "I скрининг",
  fetometry: "Фетометрия II/III",
  doppler_late: "Допплер",
  anatomy_other: "Анатомия и прочее",
};

function needsGa(tableType: string): boolean {
  return (
    tableType === "percentile_by_ga" ||
    tableType === "percentile_partial" ||
    tableType === "mean_range_by_ga" ||
    tableType.startsWith("percentile_by_ga") ||
    tableType === "percentile_by_bpd" ||
    tableType === "p50_only_by_ga"
  );
}

function needsCrl(tableType: string): boolean {
  return tableType === "percentile_by_crl";
}

export function ArchiveNormsPanel() {
  const bookStats = useMemo(() => medvedevArchiveBookStats(), []);
  const cards = useMemo(() => listArchiveCalculatorCards(), []);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(cards[0]?.tableId ?? "2.17");
  const selected = cards.find((c) => c.tableId === selectedId) ?? cards[0];
  const [subTableId, setSubTableId] = useState<string | undefined>(selected?.multiTable?.[0]);
  const parameters = selected ? listArchiveTableParameters(selected.tableId, subTableId) : [];
  const [parameterId, setParameterId] = useState<string | undefined>(parameters[0]?.id);
  const tableType = selected?.tableType ?? "percentile_by_ga";

  const [gaWeeks, setGaWeeks] = useState("20");
  const [gaDays, setGaDays] = useState("0");
  const [crlMm, setCrlMm] = useState("");
  const [value, setValue] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((c) => {
      if (!q) return true;
      return c.titleRu.toLowerCase().includes(q) || c.tableId.includes(q);
    });
  }, [cards, query]);

  const result = useMemo(() => {
    if (!selected) return null;
    const w = Number.parseInt(gaWeeks, 10);
    const d = Number.parseInt(gaDays, 10);
    const v = Number.parseFloat(value.replace(",", "."));
    const crl = crlMm.trim() ? Number.parseFloat(crlMm.replace(",", ".")) : undefined;
    return evaluateArchiveNorm({
      tableId: selected.tableId,
      subTableId,
      parameterId,
      gaWeeks: Number.isFinite(w) ? w : undefined,
      gaDays: Number.isFinite(d) ? d : undefined,
      value: Number.isFinite(v) ? v : undefined,
      crlMm: crl,
    });
  }, [selected, subTableId, parameterId, gaWeeks, gaDays, value, crlMm]);

  function pickCard(c: ArchiveCalculatorCard) {
    setSelectedId(c.tableId);
    setSubTableId(c.multiTable?.[0]);
    const params = listArchiveTableParameters(c.tableId, c.multiTable?.[0]);
    setParameterId(params[0]?.id);
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.disclaimer}>{ARCHIVE_CALCULATOR_DISCLAIMER}</Text>
      <StepCard title={`Каталог книги · ${bookStats.totalCards} таблиц`}>
        <TextInput
          style={styles.input}
          placeholder="Поиск таблицы…"
          value={query}
          onChangeText={setQuery}
        />
        <View style={styles.list}>
          {filtered.slice(0, 40).map((c) => (
            <Pressable
              key={c.tableId}
              style={[styles.listItem, c.tableId === selectedId && styles.listItemActive]}
              onPress={() => pickCard(c)}
            >
              <Text style={styles.listTitle}>{c.titleRu}</Text>
              <Text style={styles.listSub}>
                Табл. {c.tableId} · {BLOCK_LABELS[c.clinicalBlock] ?? c.clinicalBlock}
              </Text>
            </Pressable>
          ))}
          {filtered.length > 40 ? (
            <Text style={styles.more}>Показаны первые 40 из {filtered.length}. Уточните поиск.</Text>
          ) : null}
        </View>
      </StepCard>

      {selected ? (
        <StepCard title={`Таблица ${selected.tableId}`}>
          <Text style={styles.help}>{selected.titleRu}</Text>
          {parameters.length > 1 ? (
            <View style={styles.chips}>
              {parameters.map((p) => (
                <Pressable
                  key={p.id}
                  style={[styles.chip, parameterId === p.id && styles.chipActive]}
                  onPress={() => setParameterId(p.id)}
                >
                  <Text style={styles.chipText}>{p.labelRu}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {needsGa(tableType) ? (
            <View style={styles.row}>
              <View style={styles.field}>
                <Text style={styles.label}>Нед</Text>
                <TextInput style={styles.input} keyboardType="number-pad" value={gaWeeks} onChangeText={setGaWeeks} />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Дни</Text>
                <TextInput style={styles.input} keyboardType="number-pad" value={gaDays} onChangeText={setGaDays} />
              </View>
            </View>
          ) : null}
          {needsCrl(tableType) ? (
            <View style={styles.field}>
              <Text style={styles.label}>КТР, мм</Text>
              <TextInput style={styles.input} keyboardType="decimal-pad" value={crlMm} onChangeText={setCrlMm} />
            </View>
          ) : null}
          <View style={styles.field}>
            <Text style={styles.label}>Измерение</Text>
            <TextInput style={styles.input} keyboardType="decimal-pad" value={value} onChangeText={setValue} />
          </View>
          {result ? (
            <View style={[styles.result, result.ok ? styles.resultOk : styles.resultWarn]}>
              <Text style={styles.resultTitle}>{ARCHIVE_FLAG_LABELS[result.flag] ?? result.flag}</Text>
              <Text style={styles.resultBody}>{result.summary}</Text>
              {result.percentile != null ? (
                <Text style={styles.resultMeta}>Перцентиль ~{result.percentile}</Text>
              ) : null}
            </View>
          ) : null}
        </StepCard>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  disclaimer: { fontSize: 11, color: "#5C6B7A" },
  help: { fontSize: 13, color: "#64748b" },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#fff",
  },
  list: { gap: 6, maxHeight: 200 },
  listItem: { borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#fff" },
  listItemActive: { borderColor: "#0d9488", backgroundColor: "#f0fdfa" },
  listTitle: { fontSize: 13, fontWeight: "700", color: "#0F2744" },
  listSub: { fontSize: 11, color: "#64748b" },
  more: { fontSize: 11, color: "#94a3b8", fontStyle: "italic" },
  row: { flexDirection: "row", gap: 10 },
  field: { flex: 1, gap: 4 },
  label: { fontSize: 12, fontWeight: "600", color: "#334155" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  chipActive: { borderColor: "#0d9488", backgroundColor: "#ecfdf5" },
  chipText: { fontSize: 12, color: "#334155" },
  result: { borderRadius: 12, padding: 12, borderWidth: 1, gap: 4 },
  resultOk: { borderColor: "#6ee7b7", backgroundColor: "#ecfdf5" },
  resultWarn: { borderColor: "#fcd34d", backgroundColor: "#fffbeb" },
  resultTitle: { fontWeight: "800", color: "#0F2744" },
  resultBody: { fontSize: 13, color: "#334155" },
  resultMeta: { fontSize: 11, color: "#64748b" },
});
