/**
 * Mobile MMG block — mirrors web BiradsMmgCalculator (compact).
 */
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import {
  BIRADS_MMG_DISCLAIMER,
  BIRADS_MMG_SOURCE,
  buildBiradsMmgProtocol,
  defaultBiradsMmgInput,
  evaluateBiradsMmg,
  mmgOptions,
  type BiradsCategoryCode,
  type BiradsMmgFindingType,
  type BiradsMmgInput,
} from "@repo/birads-mmg";

import { branding } from "../../config/branding";
import { theme } from "../../theme";

function Chips({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((opt) => {
        const on = value === opt.value;
        return (
          <Pressable key={opt.value} style={[styles.chip, on && styles.chipOn]} onPress={() => onChange(opt.value)}>
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function BiRadsMmgMobilePanel() {
  const [input, setInput] = useState<BiradsMmgInput>(defaultBiradsMmgInput);
  const result = useMemo(() => evaluateBiradsMmg(input), [input]);
  const protocol = useMemo(() => buildBiradsMmgProtocol(input), [input]);

  function setField<K extends keyof BiradsMmgInput>(key: K, value: BiradsMmgInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      <Text style={styles.kicker}>ММГ молочных желёз · для врачей</Text>
      <Text style={styles.lead}>{BIRADS_MMG_SOURCE}</Text>

      <Text style={styles.blockTitle}>Плотность паренхимы</Text>
      <Chips
        options={mmgOptions.breastComposition}
        value={input.breastComposition}
        onChange={(v) => setField("breastComposition", v)}
      />

      <Text style={styles.blockTitle}>Тип находки</Text>
      <Chips
        options={mmgOptions.findingType}
        value={input.findingType}
        onChange={(v) => setField("findingType", v as BiradsMmgFindingType)}
      />

      {input.findingType === "mass" ? (
        <>
          <Text style={styles.blockTitle}>Mass · форма / край / плотность</Text>
          <Chips options={mmgOptions.massShape} value={input.massShape} onChange={(v) => setField("massShape", v)} />
          <Chips options={mmgOptions.massMargin} value={input.massMargin} onChange={(v) => setField("massMargin", v)} />
          <Chips options={mmgOptions.massDensity} value={input.massDensity} onChange={(v) => setField("massDensity", v)} />
        </>
      ) : null}

      {input.findingType === "calcifications" ? (
        <>
          <Text style={styles.blockTitle}>Кальцификаты</Text>
          <Chips
            options={mmgOptions.calcMorphology}
            value={input.calcMorphology}
            onChange={(v) => setField("calcMorphology", v)}
          />
          <Chips
            options={mmgOptions.calcDistribution}
            value={input.calcDistribution}
            onChange={(v) => setField("calcDistribution", v)}
          />
        </>
      ) : null}

      <Text style={styles.blockTitle}>Сравнение</Text>
      <Chips options={mmgOptions.comparison} value={input.comparison} onChange={(v) => setField("comparison", v)} />

      <Text style={styles.blockTitle}>Категория (подтверждение врача)</Text>
      <Chips
        options={mmgOptions.categories}
        value={input.biradsCategoryManual ?? result.categoryCode}
        onChange={(v) => setField("biradsCategoryManual", v as BiradsCategoryCode)}
      />

      <View style={styles.result}>
        <Text style={styles.resultTitle}>{result.category}</Text>
        <Text style={styles.resultRisk}>Риск ЗНО: {result.riskRange}</Text>
        <Text style={styles.resultBody}>{result.impression}</Text>
      </View>

      <Text style={styles.blockTitle}>Протокол</Text>
      <TextInput style={styles.protocol} multiline editable={false} value={protocol} />
      <Text style={styles.disclaimer}>{BIRADS_MMG_DISCLAIMER}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 40, gap: 8 },
  kicker: { fontSize: 12, fontWeight: "800", color: theme.colors.textSecondary, textTransform: "uppercase" },
  lead: { fontSize: 13, color: theme.colors.textSecondary, marginBottom: 8 },
  blockTitle: { marginTop: 10, fontSize: 14, fontWeight: "800", color: theme.colors.text },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: theme.colors.card,
  },
  chipOn: { backgroundColor: branding.colors.primary, borderColor: branding.colors.primary },
  chipText: { fontSize: 12, fontWeight: "600", color: theme.colors.text },
  chipTextOn: { color: "#fff" },
  result: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fecdd3",
    backgroundColor: "#fff1f2",
    padding: 14,
  },
  resultTitle: { fontSize: 18, fontWeight: "900", color: "#881337" },
  resultRisk: { marginTop: 4, fontSize: 13, color: "#9f1239" },
  resultBody: { marginTop: 6, fontSize: 13, color: theme.colors.text },
  protocol: {
    minHeight: 160,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 10,
    fontSize: 11,
    color: theme.colors.text,
    backgroundColor: theme.colors.card,
  },
  disclaimer: { marginTop: 8, fontSize: 11, color: theme.colors.textSecondary },
});
