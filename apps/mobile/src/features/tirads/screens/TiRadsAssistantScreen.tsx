import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { branding } from "../../../config/branding";
import type { RootStackParamList } from "../../../navigation/paramLists";
import { theme } from "../../../theme";
import {
  buildTiradsReportText,
  defaultTiradsInput,
  evaluateTirads,
  TI_RADS_VERSION,
  type TiradsComposition,
  type TiradsEchogenicity,
  type TiradsFoci,
  type TiradsInput,
  type TiradsMargin,
  type TiradsShape,
} from "../logic/tiradsCalculator";

type Props = NativeStackScreenProps<RootStackParamList, "TiRadsAssistant">;

type Opt<T extends string> = { value: T; label: string };

const COMPOSITION_OPTS: Opt<TiradsComposition>[] = [
  { value: "cystic", label: "Кистозный / почти кистозный" },
  { value: "spongiform", label: "Губчатый" },
  { value: "mixed", label: "Смешанный (киста + ткань)" },
  { value: "solid", label: "Твёрдый / почти твёрдый" },
  { value: "indeterminate", label: "Не определить (артефакты)" },
];

const ECHO_OPTS: Opt<TiradsEchogenicity>[] = [
  { value: "anechoic", label: "Анэхоидный" },
  { value: "hyperechoic_isoechoic", label: "Гипер- или изоэхогенный" },
  { value: "hypoechoic", label: "Гипоэхогенный" },
  { value: "very_hypoechoic", label: "Очень гипоэхогенный (к мышцам шеи)" },
];

const SHAPE_OPTS: Opt<TiradsShape>[] = [
  { value: "wider", label: "Шире, чем выше" },
  { value: "taller", label: "Выше, чем шире" },
];

const MARGIN_OPTS: Opt<TiradsMargin>[] = [
  { value: "smooth", label: "Ровный / нечёткий" },
  { value: "lobulated_irregular", label: "Дольчатый / неровный" },
  { value: "ete", label: "Экстратиреоидное распространение" },
];

const FOCI_OPTS: Opt<TiradsFoci>[] = [
  { value: "none", label: "Нет / крупный комет-хвост" },
  { value: "comet_small", label: "Мелкий комет-хвост" },
  { value: "coarse", label: "Крупные кальцификаты" },
  { value: "rim", label: "Периферический (rim) кальций" },
  { value: "punctate", label: "Пунктатные микрокальцификаты" },
];

function ChipRow<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: Opt<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{title}</Text>
      <View style={styles.chips}>
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <Pressable key={opt.value} style={[styles.chip, selected && styles.chipOn]} onPress={() => onChange(opt.value)}>
              <Text style={[styles.chipText, selected && styles.chipTextOn]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function num(v: string): number | undefined {
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export default function TiRadsAssistantScreen({ navigation }: Props) {
  const [input, setInput] = useState<TiradsInput>({ ...defaultTiradsInput });
  const [sizeText, setSizeText] = useState("");

  const inputWithSize = useMemo(
    () => ({ ...input, largestDiameterMm: num(sizeText) }),
    [input, sizeText]
  );
  const result = useMemo(() => evaluateTirads(inputWithSize), [inputWithSize]);
  const reportText = useMemo(() => buildTiradsReportText(inputWithSize, result), [inputWithSize, result]);

  function setField<K extends keyof TiradsInput>(key: K, v: TiradsInput[K]) {
    setInput((p) => ({ ...p, [key]: v }));
  }

  async function onCopy() {
    await Clipboard.setStringAsync(reportText);
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
            {TI_RADS_VERSION} · щитовидная железа
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Скрининговое УЗИ щитовидной железы: подсчёт баллов по пяти признакам и категория TR1–TR5 с ориентирами по ТАБ (размер в мм).
        </Text>

        <ChipRow title="Композиция" options={COMPOSITION_OPTS} value={input.composition} onChange={(v) => setField("composition", v)} />
        <ChipRow title="Эхогенность" options={ECHO_OPTS} value={input.echogenicity} onChange={(v) => setField("echogenicity", v)} />
        <Text style={styles.hint}>Для кистозного или губчатого узла балл за эхогенность в расчёте не добавляется (по ACR).</Text>
        <ChipRow title="Форма" options={SHAPE_OPTS} value={input.shape} onChange={(v) => setField("shape", v)} />
        <ChipRow title="Контур" options={MARGIN_OPTS} value={input.margin} onChange={(v) => setField("margin", v)} />
        <ChipRow title="Эхогенные включения" options={FOCI_OPTS} value={input.echogenicFoci} onChange={(v) => setField("echogenicFoci", v)} />

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Наибольший размер узла (мм)</Text>
          <TextInput
            style={styles.input}
            placeholder="Например, 12"
            keyboardType="decimal-pad"
            value={sizeText}
            onChangeText={setSizeText}
          />
        </View>

        <View style={styles.resultCard}>
          <Text style={styles.pointsLine}>
            Сумма баллов: <Text style={styles.pointsNum}>{result.points}</Text>
          </Text>
          <Text style={styles.resultCat}>
            {result.category} — {result.categoryLabel}
          </Text>
          <Text style={styles.resultBody}>{result.riskNarrative}</Text>
          <Text style={styles.subImp}>ТАБ / наблюдение</Text>
          <Text style={styles.resultImp}>{result.fnaRecommendation}</Text>
          <Text style={styles.resultBody}>{result.surveillanceHint}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={styles.secondary}
            onPress={() => {
              setInput({ ...defaultTiradsInput });
              setSizeText("");
            }}
          >
            <Text style={styles.secondaryText}>Сброс</Text>
          </Pressable>
          <Pressable style={styles.primary} onPress={() => void onCopy()}>
            <Text style={styles.primaryText}>Копировать заключение</Text>
          </Pressable>
        </View>
      </ScrollView>
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
  scroll: { padding: theme.spacing.md, paddingBottom: 36 },
  intro: { fontSize: 13, color: branding.colors.textSecondary, lineHeight: 19, marginBottom: 16 },
  hint: { fontSize: 11, color: "#64748b", marginTop: -12, marginBottom: 14, lineHeight: 16 },
  block: { marginBottom: 18 },
  blockTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    maxWidth: "100%",
  },
  chipOn: { borderColor: "#0d9488", backgroundColor: "#ecfdf5" },
  chipText: { fontSize: 12, color: branding.colors.text, fontWeight: "600" },
  chipTextOn: { color: "#0f766e" },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  resultCard: {
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e8ecf1",
    ...theme.shadow.card,
  },
  pointsLine: { fontSize: 14, color: branding.colors.textSecondary, fontWeight: "600" },
  pointsNum: { fontSize: 18, color: "#0f766e", fontWeight: "800" },
  resultCat: { fontSize: 18, fontWeight: "800", color: branding.colors.text, marginTop: 8, lineHeight: 24 },
  resultBody: { fontSize: 14, color: branding.colors.textSecondary, marginTop: 10, lineHeight: 21 },
  subImp: { fontSize: 11, fontWeight: "800", color: "#94a3b8", marginTop: 14, letterSpacing: 0.6 },
  resultImp: { fontSize: 14, color: "#0f172a", marginTop: 4, lineHeight: 21, fontWeight: "600" },
  actions: { marginTop: 20, gap: 10 },
  primary: {
    backgroundColor: "#0d9488",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  secondary: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
  },
  secondaryText: { color: branding.colors.text, fontWeight: "700", fontSize: 14 },
});
