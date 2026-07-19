import {
  CytologyScreeningInputSchema,
  recommendCytologyScreening,
  type CytologyBethesdaCode,
  type CytologyHpvStatus,
} from "@repo/cervix-pathology-reference/cytology";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ChipSelect } from "../components/ChipSelect";
import { BodyText, BulletList, KeyRow, SectionBlock } from "../components/SectionBlock";
import type { CervixTheme } from "../useCervixTheme";

const CYTOLOGY_OPTS: { value: CytologyBethesdaCode | "none"; label: string }[] = [
  { value: "none", label: "Не указано" },
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

function tri(value: boolean | undefined, onTrue: string, onFalse: string, unset: string) {
  if (value === true) return onTrue;
  if (value === false) return onFalse;
  return unset;
}

type Props = { theme: CervixTheme };

export function ScreeningPanel({ theme }: Props) {
  const [ageText, setAgeText] = useState("35");
  const [sexuallyActive, setSexuallyActive] = useState<boolean | undefined>(true);
  const [pregnant, setPregnant] = useState<boolean | undefined>(false);
  const [hivPositive, setHivPositive] = useState<boolean | undefined>(false);
  const [immunodeficient, setImmunodeficient] = useState<boolean | undefined>(false);
  const [postmenopausal, setPostmenopausal] = useState<boolean | undefined>(false);
  const [priorExcision, setPriorExcision] = useState<boolean | undefined>(false);
  const [cytology, setCytology] = useState<CytologyBethesdaCode | "none">("none");
  const [hpvStatus, setHpvStatus] = useState<CytologyHpvStatus>("unknown");
  const [hpv16Positive, setHpv16Positive] = useState(false);
  const [hpv18Positive, setHpv18Positive] = useState(false);

  const result = useMemo(() => {
    const age = Math.min(90, Math.max(14, parseInt(ageText, 10) || 35));
    const input = {
      age,
      sexuallyActive,
      pregnant,
      hivPositive,
      immunodeficient,
      postmenopausal,
      priorExcision,
      cytology: cytology === "none" ? null : cytology,
      hpvStatus,
      hpv16Positive,
      hpv18Positive,
    };
    const parsed = CytologyScreeningInputSchema.safeParse(input);
    if (!parsed.success) return null;
    return recommendCytologyScreening(parsed.data);
  }, [
    ageText,
    sexuallyActive,
    pregnant,
    hivPositive,
    immunodeficient,
    postmenopausal,
    priorExcision,
    cytology,
    hpvStatus,
    hpv16Positive,
    hpv18Positive,
  ]);

  const riskColor =
    result?.riskLevel === "high"
      ? theme.colors.riskHigh
      : result?.riskLevel === "moderate"
        ? theme.colors.riskModerate
        : theme.colors.riskLow;

  return (
    <View>
      <SectionBlock title="Параметры скрининга" theme={theme}>
        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Возраст (14–90)</Text>
        <TextInput
          style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.card }]}
          keyboardType="number-pad"
          value={ageText}
          onChangeText={setAgeText}
        />

        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Половая жизнь</Text>
        <ChipSelect
          theme={theme}
          value={tri(sexuallyActive, "yes", "no", "unk") as "yes" | "no" | "unk"}
          onChange={(v) => setSexuallyActive(v === "unk" ? undefined : v === "yes")}
          options={[
            { value: "yes", label: "Да" },
            { value: "no", label: "Нет" },
            { value: "unk", label: "Не указано" },
          ]}
        />

        <FlagRow label="Беременность" value={pregnant} onChange={setPregnant} theme={theme} />
        <FlagRow label="ВИЧ+" value={hivPositive} onChange={setHivPositive} theme={theme} />
        <FlagRow label="Иммунодефицит" value={immunodeficient} onChange={setImmunodeficient} theme={theme} />
        <FlagRow label="Постменопауза" value={postmenopausal} onChange={setPostmenopausal} theme={theme} />
        <FlagRow label="После конизации/excision" value={priorExcision} onChange={setPriorExcision} theme={theme} />

        <Text style={[styles.label, { color: theme.colors.textMuted }]}>Цитология (Bethesda)</Text>
        <ChipSelect theme={theme} value={cytology} onChange={setCytology} options={CYTOLOGY_OPTS} />

        <Text style={[styles.label, { color: theme.colors.textMuted }]}>HPV</Text>
        <ChipSelect theme={theme} value={hpvStatus} onChange={setHpvStatus} options={HPV_OPTS} />

        <View style={styles.flagsRow}>
          <MiniFlag label="HPV16+" value={hpv16Positive} onPress={() => setHpv16Positive((v) => !v)} theme={theme} />
          <MiniFlag label="HPV18+" value={hpv18Positive} onPress={() => setHpv18Positive((v) => !v)} theme={theme} />
        </View>
      </SectionBlock>

      {result ? (
        <SectionBlock title="Рекомендация (CDS)" theme={theme}>
          <Text style={[styles.risk, { color: riskColor }]}>Риск: {result.riskLevel}</Text>
          <BodyText theme={theme}>{result.summary}</BodyText>
          <BulletList theme={theme} items={result.actionsNow} />
          {result.colposcopyNeeded ? <KeyRow theme={theme} label="Кольпоскопия" value="Показана" /> : null}
          {result.hpvTestNeeded ? <KeyRow theme={theme} label="HPV-test" value="Нужен" /> : null}
          {result.referSpecialist ? <KeyRow theme={theme} label="Онкогинеколог" value="Рассмотреть направление" /> : null}
          {result.nextScreeningMonths != null ? (
            <KeyRow theme={theme} label="След. скрининг" value={`~${result.nextScreeningMonths} мес.`} />
          ) : null}
          {result.missingData.length ? (
            <>
              <Text style={[styles.label, { color: theme.colors.textMuted }]}>Недостающие данные</Text>
              <BulletList theme={theme} items={result.missingData} />
            </>
          ) : null}
          {result.validationNotes.length ? <BulletList theme={theme} items={result.validationNotes} /> : null}
          <BodyText theme={theme}>{result.disclaimer}</BodyText>
        </SectionBlock>
      ) : null}
    </View>
  );
}

function FlagRow({
  label,
  value,
  onChange,
  theme,
}: {
  label: string;
  value: boolean | undefined;
  onChange: (v: boolean | undefined) => void;
  theme: CervixTheme;
}) {
  return (
    <View style={styles.flagBlock}>
      <Text style={[styles.label, { color: theme.colors.textMuted }]}>{label}</Text>
      <ChipSelect
        theme={theme}
        value={tri(value, "yes", "no", "unk") as "yes" | "no" | "unk"}
        onChange={(v) => onChange(v === "unk" ? undefined : v === "yes")}
        options={[
          { value: "yes", label: "Да" },
          { value: "no", label: "Нет" },
          { value: "unk", label: "Не указано" },
        ]}
      />
    </View>
  );
}

function MiniFlag({
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
        styles.miniFlag,
        {
          backgroundColor: value ? theme.colors.chipOn : theme.colors.chip,
          borderColor: value ? theme.colors.primary : theme.colors.border,
        },
      ]}
      onPress={onPress}
    >
      <Text style={{ color: value ? theme.colors.chipOnText : theme.colors.text, fontWeight: "700", fontSize: 13 }}>
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
    fontSize: 16,
    marginTop: 4,
  },
  flagBlock: { marginTop: 4 },
  flagsRow: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
  miniFlag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  risk: { fontSize: 14, fontWeight: "800" },
});
