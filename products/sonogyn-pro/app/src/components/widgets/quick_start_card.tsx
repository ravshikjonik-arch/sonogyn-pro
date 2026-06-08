import { Pressable, StyleSheet, Text, View } from "react-native";
import type { CasePreview } from "../../features/case/types";
import { calcClinicalProgress } from "./case_progress";
import { branding } from "../../config/branding";

type Props = {
  lastCase?: CasePreview;
  onNewCase: () => void;
  onContinue: (id: string) => void;
};

export default function QuickStartCard({ lastCase, onNewCase, onContinue }: Props) {
  const hasCase = !!lastCase;
  const progress = lastCase ? calcClinicalProgress(lastCase) : null;
  const pct = progress?.percent ?? 0;
  return (
    <View style={styles.card}>
      {!hasCase ? (
        <>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>◉</Text>
          </View>
          <Text style={styles.title}>Быстрый старт</Text>
          <Text style={styles.subtitle}>Начните оценку по O-RADS</Text>
          <Pressable style={styles.cta} onPress={onNewCase}>
            <Text style={styles.ctaText}>+ Новый кейс</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.title}>Активный кейс</Text>
          <Text style={styles.patient}>ID: {lastCase.id.slice(0, 8)}</Text>
          <Text style={styles.subtitle}>
            Протокол: {progress?.completed}/{progress?.total} шагов ({pct}%)
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <Pressable style={styles.cta} onPress={() => onContinue(lastCase.id)}>
            <Text style={styles.ctaText}>Продолжить</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: branding.colors.primary,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#0f172a",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  icon: { color: "#fff", fontSize: 22, fontWeight: "800" },
  title: { color: "#fff", fontSize: 20, fontWeight: "800" },
  patient: { color: "#E6F2FF", fontSize: 14, marginTop: 4, fontWeight: "600" },
  subtitle: { color: "#E6F2FF", marginTop: 4, marginBottom: 10 },
  cta: {
    alignSelf: "flex-start",
    marginTop: 4,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  ctaText: { color: branding.colors.primary, fontWeight: "800" },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.28)",
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: { height: 8, borderRadius: 999, backgroundColor: "#fff" },
});
