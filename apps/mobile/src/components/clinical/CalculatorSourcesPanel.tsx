import { getCalculatorGuidelineSources } from "@repo/clinical-tools";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";

import { webAppUrl } from "../../lib/clinical-tools/openClinicalTool";

type Props = {
  calculatorId: string;
};

export function CalculatorSourcesPanel({ calculatorId }: Props) {
  const sources = getCalculatorGuidelineSources(calculatorId);
  if (sources.length === 0) return null;

  const open = (href: string) => {
    const url = href.startsWith("http") ? href : webAppUrl(href);
    void Linking.openURL(url);
  };

  return (
    <View
      style={styles.wrap}
      accessibilityRole="summary"
      accessibilityLabel="Источники рекомендаций и методов расчёта"
    >
      <Text style={styles.kicker}>Источники</Text>
      <Text style={styles.hint}>Ссылки на гайдлайны и первоисточники (Guideline 1.4.1).</Text>
      {sources.map((item) => (
        <Pressable
          key={`${item.href}-${item.label}`}
          onPress={() => open(item.href)}
          accessibilityRole="link"
          accessibilityHint="Открыть источник в браузере"
          style={styles.row}
        >
          <Text style={styles.link}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    gap: 6,
  },
  kicker: { fontSize: 11, fontWeight: "800", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.6 },
  hint: { fontSize: 11, color: "#94a3b8", lineHeight: 16, marginBottom: 4 },
  row: { paddingVertical: 4 },
  link: { fontSize: 14, fontWeight: "600", color: "#0369a1", lineHeight: 20 },
});