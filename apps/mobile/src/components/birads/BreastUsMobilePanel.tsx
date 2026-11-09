import * as Clipboard from "expo-clipboard";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import {
  BIRADS_ASSOCIATED_OPTIONS,
  BIRADS_CALC_OPTIONS,
  BIRADS_ECHO_OPTIONS,
  BIRADS_FIELD_LABEL_RU,
  BIRADS_KIND_OPTIONS,
  BIRADS_MARGIN_OPTIONS,
  BIRADS_NML_DISTRIBUTION_OPTIONS,
  BIRADS_NML_ECHO_OPTIONS,
  BIRADS_ORIENTATION_OPTIONS,
  BIRADS_POSTERIOR_OPTIONS,
  BIRADS_SHAPE_OPTIONS,
  BIRADS_SPECIAL_CASE_OPTIONS,
  BIRADS_SUSPICIOUS_LABEL_RU,
  BIRADS_VASCULARITY_OPTIONS,
  evaluateBreastStudy,
  generateBreastReport,
  type BiradsAssociatedFeature,
  type BiradsCategory,
  type BiradsUsLesionInput,
  type BreastLesion,
  type BreastLymphAssessment,
  type BreastLymphStation,
  type BreastSide,
  type BreastStudyInput,
} from "@repo/birads-us";

import { branding } from "../../config/branding";
import { theme } from "../../theme";

type Opt<T extends string> = { value: T; labelRu: string };

const SIDES: Opt<BreastSide>[] = [
  { value: "right", labelRu: "Правая" },
  { value: "left", labelRu: "Левая" },
];
const STATIONS: Opt<BreastLymphStation>[] = [
  { value: "intramammary", labelRu: "Интрамаммарный" },
  { value: "axillary_I", labelRu: "Подмышечный I" },
  { value: "axillary_II", labelRu: "Подмышечный II" },
  { value: "axillary_III", labelRu: "Подмышечный III" },
  { value: "internal_mammary", labelRu: "Внутренний грудной" },
  { value: "supraclavicular", labelRu: "Надключичный" },
];
const LN_ASSESSMENT: Opt<BreastLymphAssessment>[] = [
  { value: "normal", labelRu: "Без особенностей" },
  { value: "indeterminate", labelRu: "Неопределённый" },
  { value: "suspicious", labelRu: "Подозрительный" },
];
const ALL: BiradsCategory[] = ["0", "1", "2", "3", "4A", "4B", "4C", "5", "6"];
const RANK: Record<BiradsCategory, number> = { "1": 1, "2": 2, "3": 3, "6": 4, "0": 5, "4A": 6, "4B": 7, "4C": 8, "5": 9 };

function Chips<T extends string>({ title, options, value, onChange }: { title?: string; options: Opt<T>[]; value: T | undefined; onChange: (v: T | undefined) => void }) {
  return (
    <View style={styles.block}>
      {title ? <Text style={styles.blockTitle}>{title}</Text> : null}
      <View style={styles.chips}>
        {options.map((o) => {
          const on = value === o.value;
          return (
            <Pressable key={o.value} style={[styles.chip, on && styles.chipOn]} onPress={() => onChange(on ? undefined : o.value)} accessibilityRole="button" accessibilityState={{ selected: on }}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{o.labelRu}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number | undefined; onChange: (v: number | undefined) => void }) {
  const [text, setText] = useState(value !== undefined ? String(value) : "");
  return (
    <View style={styles.numCell}>
      <Text style={styles.numLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        accessibilityLabel={label}
        value={text}
        onChangeText={(t) => {
          setText(t);
          const n = Number(t.replace(",", "."));
          onChange(t.trim() && Number.isFinite(n) ? n : undefined);
        }}
      />
    </View>
  );
}

let seq = 1;
const newLesion = (side?: BreastSide): BreastLesion => ({ id: `m-lesion-${seq++}`, side, findings: {} });

export function BreastUsMobilePanel({ onCategoryHint }: { onCategoryHint?: (category: string | null) => void }) {
  const [study, setStudy] = useState<BreastStudyInput>(() => ({ sidesExamined: ["right", "left"], lesions: [newLesion("right")], lymphNodes: [] }));
  const [activeId, setActiveId] = useState(study.lesions[0]?.id ?? "");
  const [showAll, setShowAll] = useState(false);

  const evaluation = useMemo(() => evaluateBreastStudy(study), [study]);
  const report = useMemo(() => generateBreastReport(study, evaluation), [study, evaluation]);
  const active = study.lesions.find((l) => l.id === activeId) ?? study.lesions[0];
  const result = evaluation.lesions.find((l) => l.lesionId === active?.id)?.result;

  useEffect(() => {
    let best: BiradsCategory | null = null;
    for (const s of evaluation.sides) if (s.status === "final" && (best === null || RANK[s.info.category] > RANK[best])) best = s.info.category;
    onCategoryHint?.(best ? `BI-RADS ${best}` : null);
  }, [evaluation, onCategoryHint]);

  const update = (next: BreastLesion) => setStudy((s) => ({ ...s, lesions: s.lesions.map((l) => (l.id === next.id ? next : l)) }));
  const f: BiradsUsLesionInput = active?.findings ?? {};
  const setF = (patch: Partial<BiradsUsLesionInput>) => active && update({ ...active, findings: { ...f, ...patch } });
  const assoc = f.associated ?? [];
  const toggleAssoc = (a: BiradsAssociatedFeature) => {
    if (a === "none") return setF({ associated: assoc.includes("none") ? [] : ["none"] });
    const rest = assoc.filter((x) => x !== "none");
    setF({ associated: rest.includes(a) ? rest.filter((x) => x !== a) : [...rest, a] });
  };
  const lymph = study.lymphNodes ?? [];
  const setLymph = (next: typeof lymph) => setStudy((s) => ({ ...s, lymphNodes: next }));

  const options = result?.status === "ok" ? (result.pathway.kind === "determined" ? [result.pathway.category] : result.pathway.options) : [];
  const fullText = [report.descriptionRu, "", "Заключение:", report.conclusionRu, report.recommendationsRu ? `\nРекомендации:\n${report.recommendationsRu}` : "", "", report.disclaimerRu].join("\n");

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.kicker}>Исследование</Text>
        <View style={styles.chips}>
          {SIDES.map((s) => {
            const on = study.sidesExamined.includes(s.value);
            return (
              <Pressable
                key={s.value}
                style={[styles.chip, on && styles.chipOn]}
                onPress={() =>
                  setStudy((st) => ({ ...st, sidesExamined: on ? st.sidesExamined.filter((x) => x !== s.value) : [...st.sidesExamined, s.value] }))
                }
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{s.labelRu} осмотрена</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.chips}>
          {study.lesions.map((l, i) => {
            const on = l.id === active?.id;
            const r = evaluation.lesions.find((e) => e.lesionId === l.id)?.result;
            const cat = r?.status === "ok" ? (r.final ? ` · ${r.final.category}` : " · выбор врача") : "";
            return (
              <Pressable key={l.id} style={[styles.chip, on && styles.chipOn]} onPress={() => setActiveId(l.id)} accessibilityRole="button" accessibilityState={{ selected: on }}>
                <Text style={[styles.chipText, on && styles.chipTextOn]}>
                  Образование {i + 1}
                  {cat}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            style={styles.chip}
            onPress={() => {
              const l = newLesion(active?.side);
              setStudy((s) => ({ ...s, lesions: [...s.lesions, l] }));
              setActiveId(l.id);
            }}
            accessibilityRole="button"
          >
            <Text style={styles.chipText}>+ Образование</Text>
          </Pressable>
        </View>
      </View>

      {active ? (
        <>
          <Chips title="Сторона" options={SIDES} value={active.side} onChange={(side) => update({ ...active, side })} />
          <View style={styles.numRow} key={`loc-${active.id}`}>
            <NumberInput label="Циферблат, ч" value={active.clock} onChange={(clock) => update({ ...active, clock })} />
            <NumberInput label="От соска, мм" value={active.distanceFromNippleMm} onChange={(distanceFromNippleMm) => update({ ...active, distanceFromNippleMm })} />
          </View>
          <View style={styles.numRow} key={`dims-${active.id}`}>
            <NumberInput label="Ширина" value={active.dimensionsMm?.width} onChange={(width) => update({ ...active, dimensionsMm: { ...active.dimensionsMm, width } })} />
            <NumberInput label="ПЗ" value={active.dimensionsMm?.anteroposterior} onChange={(anteroposterior) => update({ ...active, dimensionsMm: { ...active.dimensionsMm, anteroposterior } })} />
            <NumberInput label="Длина" value={active.dimensionsMm?.length} onChange={(length) => update({ ...active, dimensionsMm: { ...active.dimensionsMm, length } })} />
          </View>

          <Chips title="Тип находки" options={BIRADS_KIND_OPTIONS} value={f.kind} onChange={(kind) => setF({ kind })} />
          {f.kind === "special_case" ? <Chips title="Особый случай" options={BIRADS_SPECIAL_CASE_OPTIONS} value={f.specialCase} onChange={(specialCase) => setF({ specialCase })} /> : null}
          {f.kind === "mass" ? (
            <>
              <Chips title="Форма" options={BIRADS_SHAPE_OPTIONS} value={f.shape} onChange={(shape) => setF({ shape })} />
              <Chips title="Ориентация" options={BIRADS_ORIENTATION_OPTIONS} value={f.orientation} onChange={(orientation) => setF({ orientation })} />
              <Chips title="Контур" options={BIRADS_MARGIN_OPTIONS} value={f.margin} onChange={(margin) => setF({ margin })} />
              <Chips title="Эхоструктура" options={BIRADS_ECHO_OPTIONS} value={f.echoPattern} onChange={(echoPattern) => setF({ echoPattern })} />
              <Chips title="Задние признаки" options={BIRADS_POSTERIOR_OPTIONS} value={f.posterior} onChange={(posterior) => setF({ posterior })} />
            </>
          ) : null}
          {f.kind === "non_mass" ? (
            <>
              <Chips title="Распределение" options={BIRADS_NML_DISTRIBUTION_OPTIONS} value={f.nmlDistribution} onChange={(nmlDistribution) => setF({ nmlDistribution })} />
              <Chips title="Эхогенность" options={BIRADS_NML_ECHO_OPTIONS} value={f.nmlEcho} onChange={(nmlEcho) => setF({ nmlEcho })} />
              <Chips title="Задние признаки" options={BIRADS_POSTERIOR_OPTIONS} value={f.nmlPosterior} onChange={(nmlPosterior) => setF({ nmlPosterior })} />
            </>
          ) : null}
          {f.kind === "mass" || f.kind === "non_mass" ? (
            <>
              <Chips title="Кальцинаты" options={BIRADS_CALC_OPTIONS} value={f.calcifications} onChange={(calcifications) => setF({ calcifications })} />
              <View style={styles.block}>
                <Text style={styles.blockTitle}>Сопутствующие признаки · все, что есть</Text>
                <View style={styles.chips}>
                  {BIRADS_ASSOCIATED_OPTIONS.map((o) => {
                    const on = assoc.includes(o.value);
                    return (
                      <Pressable key={o.value} style={[styles.chip, on && styles.chipOn]} onPress={() => toggleAssoc(o.value)} accessibilityRole="button" accessibilityState={{ selected: on }}>
                        <Text style={[styles.chipText, on && styles.chipTextOn]}>{o.labelRu}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              <Chips title="Кровоток (необязательно)" options={BIRADS_VASCULARITY_OPTIONS} value={f.vascularity} onChange={(vascularity) => setF({ vascularity })} />
              <View style={styles.switchRow}>
                <Text style={styles.body}>Стабильно 2–3 года по предыдущим снимкам</Text>
                <Switch value={Boolean(f.stableOnPriors)} onValueChange={(v) => setF({ stableOnPriors: v || undefined })} />
              </View>
            </>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.kicker}>BI-RADS · результат</Text>
            {!result ? null : result.status === "invalid" ? (
              <Text style={styles.body}>{result.errors.map((e) => e.messageRu).join(" ")}</Text>
            ) : result.status === "incomplete" ? (
              <Text style={styles.body}>Не хватает данных: {result.missing.map((m) => BIRADS_FIELD_LABEL_RU[m]).join(", ")}.</Text>
            ) : (
              <>
                <Text style={styles.category}>{result.final ? result.final.labelRu : options.every((o) => ["4A", "4B", "4C", "5"].includes(o)) ? "≥ BI-RADS 4 · выберите категорию" : "Выберите категорию"}</Text>
                {result.final ? (
                  <>
                    <Text style={styles.body}>Вероятность злокачественности: {result.final.likelihoodRu}</Text>
                    <Text style={[styles.body, styles.bold]}>{result.final.managementRu}</Text>
                  </>
                ) : null}
                <Text style={styles.body}>{result.pathway.reasonRu}</Text>
                {result.suspiciousFeatures.map((s) => (
                  <Text key={s} style={styles.rationale}>
                    • {BIRADS_SUSPICIOUS_LABEL_RU[s]}
                  </Text>
                ))}
                <Text style={styles.blockTitle}>Категория врача</Text>
                <View style={styles.chips}>
                  {(showAll ? ALL : options).map((c) => {
                    const on = f.doctorCategory === c;
                    return (
                      <Pressable key={c} style={[styles.chip, on && styles.chipOn]} onPress={() => setF({ doctorCategory: on ? undefined : c })} accessibilityRole="button" accessibilityState={{ selected: on }}>
                        <Text style={[styles.chipText, on && styles.chipTextOn]}>BI-RADS {c}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Pressable onPress={() => setShowAll((v) => !v)} accessibilityRole="button">
                  <Text style={styles.link}>{showAll ? "Только варианты по признакам" : "Другая категория (0, 1, 6 и др.)"}</Text>
                </Pressable>
                {result.notesRu.map((n) => (
                  <Text key={n} style={styles.warning}>
                    ⚠ {n}
                  </Text>
                ))}
                <Text style={styles.source}>Источник: {result.source.citation}</Text>
              </>
            )}
          </View>
        </>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.kicker}>Лимфоузлы (оцениваются отдельно)</Text>
        {lymph.map((n, i) => (
          <View key={i} style={styles.lnRow}>
            <Chips options={SIDES} value={n.side} onChange={(side) => side && setLymph(lymph.map((x, j) => (j === i ? { ...x, side } : x)))} />
            <Chips options={STATIONS} value={n.station} onChange={(station) => station && setLymph(lymph.map((x, j) => (j === i ? { ...x, station } : x)))} />
            <Chips options={LN_ASSESSMENT} value={n.assessment} onChange={(assessment) => assessment && setLymph(lymph.map((x, j) => (j === i ? { ...x, assessment } : x)))} />
            <Pressable onPress={() => setLymph(lymph.filter((_, j) => j !== i))} accessibilityRole="button">
              <Text style={styles.link}>Удалить</Text>
            </Pressable>
          </View>
        ))}
        <Pressable style={styles.chip} onPress={() => setLymph([...lymph, { side: active?.side ?? "right", station: "axillary_I", assessment: "normal" }])} accessibilityRole="button">
          <Text style={styles.chipText}>+ Лимфоузел</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.kicker}>Описание и заключение</Text>
        <Text style={styles.body}>{report.descriptionRu}</Text>
        <Text style={[styles.body, styles.bold]}>{report.conclusionRu}</Text>
        {report.recommendationsRu ? <Text style={styles.body}>{report.recommendationsRu}</Text> : null}
        {report.warningsRu.map((w) => (
          <Text key={w} style={styles.warning}>
            ⚠ {w}
          </Text>
        ))}
        <Text style={styles.source}>{report.disclaimerRu}</Text>
        <Pressable
          style={styles.primary}
          onPress={() => void Clipboard.setStringAsync(fullText).then(() => Alert.alert("Скопировано", "Заключение в буфере обмена."))}
          accessibilityRole="button"
        >
          <Text style={styles.primaryText}>Скопировать заключение</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: 14 },
  blockTitle: { fontSize: 11, fontWeight: "800", color: "#94a3b8", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#fff", maxWidth: "100%" },
  chipOn: { borderColor: "#e11d48", backgroundColor: "#fff1f2" },
  chipText: { fontSize: 12, color: branding.colors.text, fontWeight: "600" },
  chipTextOn: { color: "#be123c" },
  numRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  numCell: { flex: 1 },
  numLabel: { fontSize: 11, color: branding.colors.textSecondary, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 10, backgroundColor: "#fff", fontSize: 16 },
  card: { marginBottom: 16, padding: 16, borderRadius: 16, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e8ecf1", gap: 8, ...theme.shadow.card },
  kicker: { fontSize: 11, fontWeight: "800", color: "#94a3b8", letterSpacing: 0.8, textTransform: "uppercase" },
  category: { fontSize: 20, fontWeight: "900", color: branding.colors.text },
  body: { fontSize: 14, color: branding.colors.text, lineHeight: 20 },
  bold: { fontWeight: "700" },
  rationale: { fontSize: 12, color: branding.colors.textSecondary, lineHeight: 18 },
  warning: { fontSize: 12, color: "#92400e", backgroundColor: "#fffbeb", borderRadius: 10, padding: 8, lineHeight: 17 },
  source: { fontSize: 11, color: "#64748b", lineHeight: 15 },
  link: { fontSize: 13, color: "#2563EB", fontWeight: "700", paddingVertical: 4 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 8 },
  lnRow: { borderWidth: 1, borderColor: "#e8ecf1", borderRadius: 12, padding: 10 },
  primary: { marginTop: 10, backgroundColor: "#e11d48", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
