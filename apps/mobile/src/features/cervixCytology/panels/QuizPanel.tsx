import { getQuizBank, type QuizLevel } from "@repo/cervix-pathology-reference/self-assessment";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BodyText, SectionBlock } from "../components/SectionBlock";
import { ChipSelect } from "../components/ChipSelect";
import type { CervixTheme } from "../useCervixTheme";

type Props = { theme: CervixTheme };

export function QuizPanel({ theme }: Props) {
  const bank = getQuizBank();
  const cytologyIds = useMemo(
    () => new Set(bank.questions.filter((q) => q.sourceId === "cervical-cytology-screening").map((q) => q.id)),
    [bank.questions],
  );
  const questions = useMemo(
    () => bank.questions.filter((q) => cytologyIds.has(q.id) || q.id.startsWith("cx-")),
    [bank.questions, cytologyIds],
  );

  const [level, setLevel] = useState<QuizLevel | "all">("all");
  const filtered = useMemo(
    () => (level === "all" ? questions : questions.filter((q) => q.level === level)),
    [level, questions],
  );

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const q = filtered[idx];
  if (!q) {
    return (
      <SectionBlock title="Самопроверка" theme={theme}>
        <BodyText theme={theme}>Вопросы модуля не найдены.</BodyText>
      </SectionBlock>
    );
  }

  const revealed = picked != null;
  const correct = picked === q.correctIndex;

  function pick(i: number) {
    if (revealed) return;
    setPicked(i);
    setScore((s) => ({
      correct: s.correct + (i === q.correctIndex ? 1 : 0),
      total: s.total + 1,
    }));
  }

  function next() {
    setIdx((i) => (i + 1) % filtered.length);
    setPicked(null);
  }

  const pct = score.total ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <View>
      <SectionBlock title="Самопроверка · цитология" theme={theme}>
        <ChipSelect
          theme={theme}
          value={level}
          onChange={setLevel}
          options={[
            { value: "all", label: "Все" },
            { value: "student", label: "Студент" },
            { value: "doctor", label: "Врач" },
          ]}
        />
        <Text style={{ color: theme.colors.textMuted, fontSize: 13 }}>
          Вопрос {idx + 1}/{filtered.length} · результат {score.correct}/{score.total} ({pct}%)
        </Text>
        <BodyText theme={theme}>{q.question}</BodyText>
        <View style={styles.options}>
          {q.options.map((opt, i) => {
            const selected = picked === i;
            const isCorrect = i === q.correctIndex;
            let bg = theme.colors.chip;
            if (revealed && isCorrect) bg = "#dcfce7";
            else if (revealed && selected && !isCorrect) bg = "#fee2e2";
            else if (selected) bg = theme.colors.chipOn;
            return (
              <Pressable
                key={opt}
                style={[styles.opt, { backgroundColor: bg, borderColor: theme.colors.border }]}
                onPress={() => pick(i)}
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
            <BodyText theme={theme}>{q.explanation}</BodyText>
            <Pressable style={[styles.btn, { backgroundColor: theme.colors.primary }]} onPress={next}>
              <Text style={styles.btnText}>Далее</Text>
            </Pressable>
          </>
        ) : null}
        <BodyText theme={theme}>
          Образовательная самопроверка. Не заменяет экзамен или клиническое решение.
        </BodyText>
      </SectionBlock>
    </View>
  );
}

const styles = StyleSheet.create({
  options: { gap: 8, marginTop: 8 },
  opt: { borderWidth: 1, borderRadius: 10, padding: 12 },
  btn: { marginTop: 12, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "800" },
});
