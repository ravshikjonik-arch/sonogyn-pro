import * as Clipboard from "expo-clipboard";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import {
  evaluateOradsUs2022,
  initialOradsUs2022Input,
  mapProInputToUs2022,
  type ClassicTypeUs2022,
  type ColorScoreUs2022,
  type MenopauseUs2022,
  type MorphologyUs2022,
  type OradsUs2022Input,
} from "@repo/orads-us/pro";

import type { RootStackParamList } from "../../../navigation/AppStack";
import { applyProtocolTextToUs2022 } from "../applyProtocolTextToUs2022";
import SelectChip from "../components/SelectChip";
import OradsUnifiedResultPanel from "../components/OradsUnifiedResultPanel";
import { appendUnifiedCaseToHistory, loadUXMetric, pushTimeToResult } from "../storage/oradsStorage";
import { buildUnifiedReportPlain } from "../storedCaseHelpers";
import type { OradsInput } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "ORADSPro">;

const MORPHOLOGY: Array<{ value: MorphologyUs2022; title: string; subtitle: string }> = [
  { value: "normal", title: "Норма / физиология", subtitle: "Без focal образования" },
  { value: "classic", title: "Classic benign", subtitle: "Дермоид, эндометриома…" },
  { value: "unilocular", title: "Однокамерная", subtitle: "Unilocular" },
  { value: "bilocular", title: "Двухкамерная", subtitle: "Bilocular" },
  { value: "multilocular", title: "Многокамерная", subtitle: "Multilocular + CS" },
  { value: "solid", title: "Солидное", subtitle: "≥80% солидного" },
];

function MorphChip({
  title,
  subtitle,
  active,
  onPress,
}: {
  title: string;
  subtitle: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.morphChip, active && styles.morphChipActive]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.morphTitle, active && styles.morphTitleActive]}>{title}</Text>
      <Text style={[styles.morphSub, active && styles.morphSubActive]}>{subtitle}</Text>
    </Pressable>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

export default function OradsUnifiedScreen({ navigation, route }: Props) {
  const [input, setInput] = useState<OradsUs2022Input>(initialOradsUs2022Input);
  const [textDraft, setTextDraft] = useState("");
  const [avgTimeToResult, setAvgTimeToResult] = useState<number | null>(null);
  const firstInteractionAtRef = useRef<number | null>(null);

  const result = useMemo(() => evaluateOradsUs2022(input), [input]);

  const isCyst = ["unilocular", "bilocular", "multilocular"].includes(input.morphology);
  const needsSize =
    isCyst ||
    input.morphology === "solid" ||
    (input.morphology === "classic" &&
      ["dermoid", "endometrioma", "hemorrhagic"].includes(input.classicType));
  const needsMenopause =
    (input.morphology === "unilocular" &&
      !input.solidComponent &&
      input.innerContour === "smooth" &&
      input.cystContent === "simple") ||
    input.classicType === "hemorrhagic";
  const needsColor =
    input.morphology === "solid" ||
    (input.morphology === "multilocular" && !input.solidComponent && input.innerContour === "smooth") ||
    (isCyst && input.solidComponent && input.morphology !== "unilocular");

  function set<K extends keyof OradsUs2022Input>(key: K, value: OradsUs2022Input[K]) {
    markInteraction();
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  function markInteraction() {
    if (!firstInteractionAtRef.current) firstInteractionAtRef.current = Date.now();
  }

  function reset() {
    setInput(initialOradsUs2022Input);
    setTextDraft("");
    firstInteractionAtRef.current = null;
  }

  function applyFromText() {
    const mapped = applyProtocolTextToUs2022(textDraft);
    if (!mapped) {
      Alert.alert("Подстановка", "Не удалось сопоставить текст — заполните форму вручную");
      return;
    }
    setInput(mapped);
    Alert.alert("Подстановка", "Признаки из текста подставлены — проверьте форму");
  }

  async function copyReport() {
    await Clipboard.setStringAsync(buildUnifiedReportPlain(input, result));
    Alert.alert("Протокол", "Текст скопирован в буфер обмена");
  }

  useEffect(() => {
    const prefill = route.params?.prefill;
    if (!prefill) return;
    if ("morphology" in prefill && typeof prefill.morphology === "string") {
      setInput(prefill as OradsUs2022Input);
      return;
    }
    const mapped = mapProInputToUs2022(prefill as OradsInput);
    if (mapped) setInput({ ...initialOradsUs2022Input, ...mapped });
  }, [route.params?.prefill]);

  useEffect(() => {
    if (result.category !== null) {
      void appendUnifiedCaseToHistory(input, result);
    }
  }, [input, result]);

  useEffect(() => {
    void loadUXMetric().then((m) => setAvgTimeToResult(m.samples > 0 ? m.avgTimeToResultSec : null));
  }, []);

  useEffect(() => {
    if (result.category === null || !firstInteractionAtRef.current) return;
    const sec = (Date.now() - firstInteractionAtRef.current) / 1000;
    void pushTimeToResult(sec);
  }, [result.category]);

  const displayCategory = result.category;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} accessibilityRole="button">
          <Text style={styles.back}>Назад</Text>
        </Pressable>
        <Text style={styles.headerTitle} accessibilityRole="header">
          O-RADS US
        </Text>
        <Pressable onPress={() => navigation.navigate("ORADSHistory")} accessibilityRole="button">
          <Text style={styles.link}>История</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View testID="orads-unified-mobile">
          <Text style={styles.h1}>Стратификация O-RADS US</Text>
          <Text style={styles.lead}>
            Категории 0–5, ROM и тактика по ACR v2022. При нескольких образованиях — отдельная оценка; ведение по
            наивысшей категории.
          </Text>
          {avgTimeToResult != null ? (
            <Text style={styles.metric}>Среднее время до результата (сессии): ~{Math.round(avgTimeToResult)} с</Text>
          ) : null}

          <OradsUnifiedResultPanel
            result={result}
            testID={displayCategory !== null ? `orads-category-${displayCategory}` : undefined}
          />

          <View style={styles.formShell}>
            <Text style={styles.sectionTitle}>Из текста протокола</Text>
            <TextInput
              value={textDraft}
              onChangeText={setTextDraft}
              multiline
              placeholder="Вставьте фрагмент описания УЗИ без ФИО…"
              style={[styles.input, styles.textArea]}
            />
            <Pressable style={styles.btnSecondary} onPress={applyFromText}>
              <Text style={styles.btnSecondaryText}>Подставить признаки</Text>
            </Pressable>

            <Text style={[styles.sectionTitle, styles.sectionGap]}>Морфология по лексикону ACR</Text>
            <View style={styles.morphGrid}>
              {MORPHOLOGY.map((m) => (
                <MorphChip
                  key={m.value}
                  title={m.title}
                  subtitle={m.subtitle}
                  active={input.morphology === m.value}
                  onPress={() =>
                    setInput((prev) => ({
                      ...initialOradsUs2022Input,
                      menopause: prev.menopause,
                      cycleRegularity: prev.cycleRegularity,
                      morphology: m.value,
                    }))
                  }
                />
              ))}
            </View>
            <Pressable
              style={styles.checkRow}
              onPress={() => set("incomplete", !input.incomplete)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: input.incomplete }}
            >
              <View style={[styles.checkbox, input.incomplete && styles.checkboxOn]} />
              <View style={styles.checkCopy}>
                <Text style={styles.checkTitle}>Технически неполное исследование</Text>
                <Text style={styles.checkSub}>→ O-RADS 0</Text>
              </View>
            </Pressable>

          {input.morphology && !input.incomplete ? (
            <>
              <Text style={[styles.sectionTitle, styles.sectionGap]}>Признаки образования</Text>

              {input.morphology === "classic" ? (
                <View style={styles.fieldBlock}>
                  <FieldLabel>Classic benign</FieldLabel>
                  <View style={styles.rowWrap}>
                    {(
                      [
                        ["dermoid", "Дермоид"],
                        ["endometrioma", "Эндометриома"],
                        ["hemorrhagic", "Геморрагическая"],
                        ["paraovarian", "Параовариальная"],
                        ["peritoneal", "Перитон. инклюзия"],
                        ["hydrosalpinx", "Гидросальпинкс"],
                      ] as const
                    ).map(([value, label]) => (
                      <SelectChip
                        key={value}
                        label={label}
                        selected={input.classicType === value}
                        onPress={() => set("classicType", value as ClassicTypeUs2022)}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {needsMenopause ? (
                <View style={styles.fieldBlock}>
                  <FieldLabel>
                    Менопауза / пременопауза · цикл регулярный / нерегулярный (O-RADS US v2022)
                  </FieldLabel>
                  <Text style={styles.fieldSub}>Статус</Text>
                  <View style={styles.rowWrap}>
                    {(
                      [
                        ["pre", "Пременопауза"],
                        ["postEarly", "Постменопауза < 5 лет"],
                        ["postLate", "Постменопауза ≥ 5 лет"],
                      ] as const
                    ).map(([value, label]) => (
                      <SelectChip
                        key={value}
                        label={label}
                        selected={input.menopause === value}
                        onPress={() =>
                          setInput((prev) => ({
                            ...prev,
                            menopause: value as MenopauseUs2022,
                            cycleRegularity: value === "pre" ? prev.cycleRegularity : "",
                          }))
                        }
                      />
                    ))}
                  </View>
                  {input.menopause === "pre" ? (
                    <>
                      <Text style={styles.fieldSub}>Менструальный цикл</Text>
                      <View style={styles.rowWrap}>
                        <SelectChip
                          label="Регулярный"
                          selected={input.cycleRegularity === "regular"}
                          onPress={() => set("cycleRegularity", "regular")}
                        />
                        <SelectChip
                          label="Нерегулярный"
                          selected={input.cycleRegularity === "irregular"}
                          onPress={() => set("cycleRegularity", "irregular")}
                        />
                      </View>
                    </>
                  ) : null}
                </View>
              ) : null}

              {needsSize ? (
                <View style={styles.fieldBlock}>
                  <FieldLabel>Макс. диаметр, см</FieldLabel>
                  <TextInput
                    keyboardType="decimal-pad"
                    value={input.sizeCm != null ? String(input.sizeCm) : ""}
                    onChangeText={(t) => {
                      markInteraction();
                      setInput((prev) => ({
                        ...prev,
                        sizeCm: t === "" ? null : Number.parseFloat(t.replace(",", ".")),
                      }));
                    }}
                    style={styles.input}
                    placeholder="например 3.5"
                  />
                </View>
              ) : null}

              {input.morphology === "unilocular" && !input.solidComponent ? (
                <View style={styles.fieldBlock}>
                  <FieldLabel>Содержимое</FieldLabel>
                  <View style={styles.rowWrap}>
                    <SelectChip
                      label="Простое"
                      selected={input.cystContent === "simple"}
                      onPress={() => set("cystContent", "simple")}
                    />
                    <SelectChip
                      label="Непростое"
                      selected={input.cystContent === "nonSimple"}
                      onPress={() => set("cystContent", "nonSimple")}
                    />
                  </View>
                </View>
              ) : null}

              {isCyst ? (
                <View style={styles.fieldBlock}>
                  <FieldLabel>Солидный компонент ≥3 мм</FieldLabel>
                  <View style={styles.rowWrap}>
                    <SelectChip
                      label="Нет"
                      selected={!input.solidComponent}
                      onPress={() => set("solidComponent", false)}
                    />
                    <SelectChip label="Да" selected={input.solidComponent} onPress={() => set("solidComponent", true)} />
                  </View>
                </View>
              ) : null}

              {isCyst && !input.solidComponent ? (
                <View style={styles.fieldBlock}>
                  <FieldLabel>Внутренний контур</FieldLabel>
                  <View style={styles.rowWrap}>
                    <SelectChip
                      label="Ровный"
                      selected={input.innerContour === "smooth"}
                      onPress={() => set("innerContour", "smooth")}
                    />
                    <SelectChip
                      label="Неровный"
                      selected={input.innerContour === "irregular"}
                      onPress={() => set("innerContour", "irregular")}
                    />
                  </View>
                </View>
              ) : null}

              {input.morphology === "unilocular" && input.solidComponent ? (
                <View style={styles.fieldBlock}>
                  <FieldLabel>Папиллярные разрастания</FieldLabel>
                  <View style={styles.rowWrap}>
                    {(
                      [
                        ["0", "Нет (solid)"],
                        ["1-3", "1–3"],
                        ["4+", "≥4"],
                      ] as const
                    ).map(([value, label]) => (
                      <SelectChip
                        key={value}
                        label={label}
                        selected={input.papillae === value}
                        onPress={() => set("papillae", value)}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {input.morphology === "solid" ? (
                <View style={styles.fieldBlock}>
                  <FieldLabel>Наружный контур</FieldLabel>
                  <View style={styles.rowWrap}>
                    <SelectChip
                      label="Ровный"
                      selected={input.outerContour === "smooth"}
                      onPress={() => set("outerContour", "smooth")}
                    />
                    <SelectChip
                      label="Неровный"
                      selected={input.outerContour === "irregular"}
                      onPress={() => set("outerContour", "irregular")}
                    />
                  </View>
                </View>
              ) : null}

              {needsColor ? (
                <View style={styles.fieldBlock}>
                  <FieldLabel>Цветовой балл IOTA (worst lesion)</FieldLabel>
                  <View style={styles.rowWrap}>
                    {([1, 2, 3, 4] as ColorScoreUs2022[]).map((n) => (
                      <SelectChip
                        key={n}
                        label={String(n)}
                        selected={input.colorScore === n}
                        onPress={() => set("colorScore", n)}
                      />
                    ))}
                  </View>
                </View>
              ) : null}

              {input.morphology === "solid" ? (
                <Pressable
                  style={styles.checkRow}
                  onPress={() => set("shadowing", !input.shadowing)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: input.shadowing }}
                >
                  <View style={[styles.checkbox, input.shadowing && styles.checkboxOn]} />
                  <Text style={styles.checkTitle}>Акустическая тень</Text>
                </Pressable>
              ) : null}

              {input.morphology !== "classic" ? (
                <View style={styles.fieldBlock}>
                  <FieldLabel>Доп. признаки</FieldLabel>
                  <View style={styles.rowWrap}>
                    <SelectChip
                      label="Нет"
                      selected={input.extraSigns === "none"}
                      onPress={() => set("extraSigns", "none")}
                    />
                    <SelectChip
                      label="Асцит"
                      selected={input.extraSigns === "ascites"}
                      onPress={() => set("extraSigns", "ascites")}
                    />
                    <SelectChip
                      label="Узелки брюшины"
                      selected={input.extraSigns === "peritoneal"}
                      onPress={() => set("extraSigns", "peritoneal")}
                    />
                  </View>
                </View>
              ) : null}
            </>
          ) : null}
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.btnSecondary} onPress={reset}>
              <Text style={styles.btnSecondaryText}>Сброс</Text>
            </Pressable>
            <Pressable style={styles.btnPrimary} onPress={copyReport}>
              <Text style={styles.btnPrimaryText}>В протокол</Text>
            </Pressable>
            <Pressable style={styles.btnGhost} onPress={() => navigation.navigate("IotaCalculator")}>
              <Text style={styles.btnGhostText}>IOTA (отдельно)</Text>
            </Pressable>
            <Pressable style={styles.btnGhost} onPress={() => navigation.navigate("ORADSGuide", {})}>
              <Text style={styles.btnGhostText}>Справка O-RADS</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FB" },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  back: { color: "#2563EB", fontWeight: "700" },
  link: { color: "#2563EB", fontWeight: "700" },
  headerTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  content: { padding: 14, paddingBottom: 40, gap: 12 },
  h1: { fontSize: 22, fontWeight: "600", color: "#0f172a", letterSpacing: -0.3 },
  formShell: {
    marginTop: 16,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 14,
    gap: 10,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#0f172a" },
  sectionGap: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  lead: { fontSize: 14, color: "#64748b", lineHeight: 20, marginTop: 4 },
  metric: { fontSize: 12, color: "#64748b", marginTop: 6 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    gap: 10,
  },
  cardTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a" },
  morphGrid: { gap: 8 },
  morphChip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  morphChipActive: { borderColor: "#2563EB", backgroundColor: "rgba(37,99,235,0.08)" },
  morphTitle: { fontWeight: "700", color: "#0f172a", fontSize: 14 },
  morphTitleActive: { color: "#1d4ed8" },
  morphSub: { fontSize: 12, color: "#64748b", marginTop: 2 },
  morphSubActive: { color: "#3b82f6" },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 4 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#94a3b8",
    marginTop: 2,
  },
  checkboxOn: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  checkCopy: { flex: 1 },
  checkTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  checkSub: { fontSize: 12, color: "#64748b" },
  fieldBlock: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: "700", color: "#334155" },
  fieldSub: { fontSize: 12, fontWeight: "600", color: "#64748b", marginTop: 4 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    fontSize: 15,
    color: "#0f172a",
  },
  textArea: { minHeight: 72, textAlignVertical: "top" },
  actions: { gap: 8, marginTop: 4 },
  btnPrimary: {
    borderRadius: 10,
    backgroundColor: "#2563EB",
    alignItems: "center",
    paddingVertical: 12,
  },
  btnPrimaryText: { color: "#fff", fontWeight: "800" },
  btnSecondary: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    alignItems: "center",
    paddingVertical: 12,
  },
  btnSecondaryText: { color: "#0f172a", fontWeight: "800" },
  btnGhost: {
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10,
  },
  btnGhostText: { color: "#2563EB", fontWeight: "700" },
});
