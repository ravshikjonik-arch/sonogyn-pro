import { useMemo } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { branding } from "../../../config/branding";
import { theme } from "../../../theme";
import {
  buildTiradsReportText,
  defaultTiradsInput,
  evaluateTirads,
  type TiradsComposition,
  type TiradsEchogenicity,
  type TiradsFoci,
  type TiradsInput,
  type TiradsMargin,
  type TiradsShape,
} from "../logic/tiradsCalculator";

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

type Props = {
  input: TiradsInput;
  onInputChange: (next: TiradsInput) => void;
  sizeText: string;
  onSizeTextChange: (v: string) => void;
  patternSource?: string | null;
  onCopyReport: (text: string) => void;
  onOpenStructuredReport?: () => void;
};

export default function TiradsAcrPanel({
  input,
  onInputChange,
  sizeText,
  onSizeTextChange,
  patternSource,
  onCopyReport,
  onOpenStructuredReport,
}: Props) {
  const inputWithSize = useMemo(
    () => ({ ...input, largestDiameterMm: num(sizeText) }),
    [input, sizeText],
  );
  const result = useMemo(() => evaluateTirads(inputWithSize), [inputWithSize]);
  const reportText = useMemo(() => buildTiradsReportText(inputWithSize, result), [inputWithSize, result]);

  function setField<K extends keyof TiradsInput>(key: K, v: TiradsInput[K]) {
    onInputChange({ ...input, [key]: v });
  }

  return (
    <>
      <Text style={styles.intro}>
        ACR TI-RADS: подсчёт баллов по пяти признакам, категории TR1–TR5 и ориентиры по ТАБ (размер в мм).
      </Text>
      {patternSource ? <Text style={styles.patternSource}>Паттерн: {patternSource}</Text> : null}

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
          onChangeText={onSizeTextChange}
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
            onInputChange({ ...defaultTiradsInput });
            onSizeTextChange("");
          }}
        >
          <Text style={styles.secondaryText}>Сброс</Text>
        </Pressable>
        <Pressable style={styles.primary} onPress={() => onCopyReport(reportText)}>
          <Text style={styles.primaryText}>Копировать заключение</Text>
        </Pressable>
        {onOpenStructuredReport ? (
          <Pressable style={styles.sreBtn} onPress={onOpenStructuredReport}>
            <Text style={styles.sreBtnText}>Структурированный протокол</Text>
          </Pressable>
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: 13, color: branding.colors.textSecondary, lineHeight: 19, marginBottom: 16 },
  patternSource: { fontSize: 12, fontWeight: "700", color: "#0369a1", marginBottom: 12 },
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
  sreBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#2563EB",
  },
  sreBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
