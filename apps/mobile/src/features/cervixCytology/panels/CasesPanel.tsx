import { getCytologyClinicalCases } from "@repo/cervix-pathology-reference/cytology";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BodyText, SectionBlock } from "../components/SectionBlock";
import type { CervixTheme } from "../useCervixTheme";

type Props = { theme: CervixTheme };

export function CasesPanel({ theme }: Props) {
  const cases = getCytologyClinicalCases();
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const current = cases[idx];

  if (!current) {
    return (
      <SectionBlock title="Клинические кейсы" theme={theme}>
        <BodyText theme={theme}>Кейсы не загружены.</BodyText>
      </SectionBlock>
    );
  }

  const revealed = picked != null;
  const correct = picked === current.correctIndex;

  function nextCase() {
    setIdx((i) => (i + 1) % cases.length);
    setPicked(null);
  }

  return (
    <View>
      <SectionBlock title={`Кейс ${idx + 1} / ${cases.length}`} theme={theme}>
        <Text style={[styles.caseTitle, { color: theme.colors.text }]}>{current.title}</Text>
        {Object.entries(current.data).map(([k, v]) => (
          <Text key={k} style={[styles.meta, { color: theme.colors.textMuted }]}>
            {k}: {String(v)}
          </Text>
        ))}
        <BodyText theme={theme}>{current.question}</BodyText>
        <View style={styles.options}>
          {current.options.map((opt, i) => {
            const selected = picked === i;
            const isCorrect = i === current.correctIndex;
            let bg = theme.colors.chip;
            if (revealed && isCorrect) bg = "#dcfce7";
            else if (revealed && selected && !isCorrect) bg = "#fee2e2";
            else if (selected) bg = theme.colors.chipOn;
            return (
              <Pressable
                key={opt}
                style={[styles.opt, { backgroundColor: bg, borderColor: theme.colors.border }]}
                onPress={() => !revealed && setPicked(i)}
                disabled={revealed}
              >
                <Text style={{ color: theme.colors.text, fontSize: 14, lineHeight: 20 }}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>
        {revealed ? (
          <>
            <Text style={{ color: correct ? theme.colors.riskLow : theme.colors.riskHigh, fontWeight: "800" }}>
              {correct ? "Верно" : "Неверно"}
            </Text>
            <BodyText theme={theme}>{current.explanation}</BodyText>
            <Pressable style={[styles.btn, { backgroundColor: theme.colors.primary }]} onPress={nextCase}>
              <Text style={styles.btnText}>Следующий кейс</Text>
            </Pressable>
          </>
        ) : null}
      </SectionBlock>
    </View>
  );
}

const styles = StyleSheet.create({
  caseTitle: { fontSize: 16, fontWeight: "800", marginBottom: 6 },
  meta: { fontSize: 12, lineHeight: 18 },
  options: { gap: 8, marginTop: 8 },
  opt: { borderWidth: 1, borderRadius: 10, padding: 12 },
  btn: { marginTop: 12, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "800" },
});
