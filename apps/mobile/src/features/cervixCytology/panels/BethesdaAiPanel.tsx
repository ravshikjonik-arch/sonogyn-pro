import {
  type CytologyBethesdaCode,
  type CytologyHpvStatus,
} from "@repo/cervix-pathology-reference/cytology";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { askBethesdaAssist } from "../../../lib/cervix-cytology/cytologyApi";
import { ChipSelect } from "../components/ChipSelect";
import { BodyText, BulletList, SectionBlock } from "../components/SectionBlock";
import type { CervixTheme } from "../useCervixTheme";

const CYTOLOGY_OPTS: { value: CytologyBethesdaCode; label: string }[] = [
  { value: "nilm", label: "NILM" },
  { value: "asc-us", label: "ASC-US" },
  { value: "asc-h", label: "ASC-H" },
  { value: "lsil", label: "LSIL" },
  { value: "hsil", label: "HSIL" },
  { value: "agc", label: "AGC" },
  { value: "ais", label: "AIS" },
  { value: "carcinoma", label: "Карцинома" },
  { value: "unsatisfactory", label: "Unsat." },
];

const HPV_OPTS: { value: CytologyHpvStatus; label: string }[] = [
  { value: "unknown", label: "Неизвестно" },
  { value: "negative", label: "HPV−" },
  { value: "positive", label: "HPV+" },
  { value: "16-positive", label: "HPV16+" },
  { value: "18-positive", label: "HPV18+" },
];

type Props = { theme: CervixTheme };

export function BethesdaAiPanel({ theme }: Props) {
  const [ageText, setAgeText] = useState("35");
  const [cytology, setCytology] = useState<CytologyBethesdaCode>("asc-us");
  const [hpvStatus, setHpvStatus] = useState<CytologyHpvStatus>("positive");
  const [hpv16Positive, setHpv16Positive] = useState(false);
  const [hpv18Positive, setHpv18Positive] = useState(false);
  const [priorExcision, setPriorExcision] = useState(false);
  const [hivPositive, setHivPositive] = useState(false);
  const [histology, setHistology] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answer, setAnswer] = useState<Awaited<ReturnType<typeof askBethesdaAssist>> | null>(null);

  async function runAssist() {
    setLoading(true);
    setError(null);
    try {
      const age = Math.min(90, Math.max(14, parseInt(ageText, 10) || 35));
      const res = await askBethesdaAssist({
        age,
        cytology,
        hpvStatus,
        hpv16Positive,
        hpv18Positive,
        priorExcision,
        hivPositive,
        histology: histology.trim() || null,
      });
      setAnswer(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка запроса");
    } finally {
      setLoading(false);
    }
  }

  const riskColor =
    answer?.riskLevel === "critical" || answer?.riskLevel === "high"
      ? theme.colors.riskHigh
      : answer?.riskLevel === "moderate"
        ? theme.colors.riskModerate
        : theme.colors.riskLow;

  return (
    <View>
      <SectionBlock title="⚠️ Не вводите персональные данные" theme={theme}>
        <BodyText theme={theme}>
          Без ФИО, телефона, email и даты рождения пациентки. Только клинические параметры (возраст, Bethesda, HPV).
          Ответ образовательный — не диагноз.
        </BodyText>
      </SectionBlock>

      <SectionBlock title="Входные данные" theme={theme}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Возраст</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
          keyboardType="number-pad"
          value={ageText}
          onChangeText={setAgeText}
        />
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Bethesda</Text>
        <ChipSelect theme={theme} value={cytology} onChange={setCytology} options={CYTOLOGY_OPTS} />
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>HPV</Text>
        <ChipSelect theme={theme} value={hpvStatus} onChange={setHpvStatus} options={HPV_OPTS} />
        <View style={styles.flagsRow}>
          <ToggleFlag label="HPV16+" value={hpv16Positive} onPress={() => setHpv16Positive((v) => !v)} theme={theme} />
          <ToggleFlag label="HPV18+" value={hpv18Positive} onPress={() => setHpv18Positive((v) => !v)} theme={theme} />
          <ToggleFlag label="После excision" value={priorExcision} onPress={() => setPriorExcision((v) => !v)} theme={theme} />
          <ToggleFlag label="ВИЧ+" value={hivPositive} onPress={() => setHivPositive((v) => !v)} theme={theme} />
        </View>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Гистология (опционально, без PHI)</Text>
        <TextInput
          style={[styles.input, styles.multiline, { color: theme.colors.text, borderColor: theme.colors.border }]}
          placeholder="CIN1, CIN2…"
          placeholderTextColor={theme.colors.textMuted}
          value={histology}
          onChangeText={setHistology}
          multiline
        />
        <Pressable style={[styles.btn, { backgroundColor: theme.colors.primary }]} onPress={() => void runAssist()} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Интерпретировать Bethesda</Text>}
        </Pressable>
        {error ? <Text style={{ color: theme.colors.riskHigh }}>{error}</Text> : null}
      </SectionBlock>

      {answer ? (
        <SectionBlock title="Образовательный ответ" theme={theme}>
          <Text style={[styles.risk, { color: riskColor }]}>Уровень: {answer.riskLevel}</Text>
          <BodyText theme={theme}>{answer.interpretation}</BodyText>
          <BulletList theme={theme} items={answer.nextSteps} />
          {answer.explainToPatient ? (
            <>
              <Text style={[styles.label, { color: theme.colors.textMuted }]}>Как объяснить пациентке</Text>
              <BodyText theme={theme}>{answer.explainToPatient}</BodyText>
            </>
          ) : null}
          {answer.avoid.length ? <BulletList theme={theme} items={answer.avoid.map((a) => `Избегать: ${a}`)} /> : null}
          <BodyText theme={theme}>{answer.disclaimer}</BodyText>
        </SectionBlock>
      ) : null}
    </View>
  );
}

function ToggleFlag({
  label,
  value,
  onPress,
  theme,
}: {
  label: string;
  value: boolean;
  onPress: () => void;
  theme: CervixTheme;
}) {
  return (
    <Pressable
      style={[
        styles.flag,
        {
          backgroundColor: value ? theme.colors.chipOn : theme.colors.chip,
          borderColor: value ? theme.colors.primary : theme.colors.border,
        },
      ]}
      onPress={onPress}
    >
      <Text style={{ color: value ? theme.colors.chipOnText : theme.colors.text, fontSize: 12, fontWeight: "700" }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginTop: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginTop: 4,
  },
  multiline: { minHeight: 72, textAlignVertical: "top" },
  flagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  flag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  btn: { marginTop: 12, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  risk: { fontSize: 14, fontWeight: "800", marginBottom: 6 },
});
