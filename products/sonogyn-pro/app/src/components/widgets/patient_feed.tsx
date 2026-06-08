import { Pressable, StyleSheet, Text, View } from "react-native";
import type { CasePreview } from "../../features/case/types";
import { calcClinicalProgress } from "./case_progress";
import { branding } from "../../config/branding";

type Props = {
  items: CasePreview[];
  onCreate: () => void;
  onOpenCase: (id: string) => void;
};

function fmt(ts?: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("ru-RU");
}

export default function PatientFeed({ items, onCreate, onOpenCase }: Props) {
  if (!items.length) {
    return (
      <View style={styles.emptyCard}>
        <View style={styles.emptyCircle}>
          <Text style={styles.emptyIcon}>◉</Text>
        </View>
        <Text style={styles.emptyTitle}>Создайте первый клинический случай</Text>
        <Pressable style={styles.cta} onPress={onCreate}>
          <Text style={styles.ctaText}>Внести данные пациентки</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.listWrap}>
      {items.slice(0, 8).map((item) => {
        const p = calcClinicalProgress(item);
        return (
          <Pressable key={item.id} style={styles.rowCard} onPress={() => onOpenCase(item.id)}>
            <View style={styles.rowTop}>
              <Text style={styles.title}>{item.result?.trim() ? item.result : "Без финального диагноза"}</Text>
              <Text style={styles.date}>{fmt(item.createdAt)}</Text>
            </View>
            <Text style={styles.meta}>
              Орган: {item.organ} • O-RADS шаги: {p.completed}/{p.total}
            </Text>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${p.percent}%` }]} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#dbeafe",
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  emptyCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyIcon: { color: "#005CB9", fontSize: 26, fontWeight: "700" },
  emptyTitle: { color: "#334155", fontWeight: "700", marginBottom: 10 },
  cta: { backgroundColor: branding.colors.primary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  ctaText: { color: "#fff", fontWeight: "700" },
  listWrap: { gap: 10 },
  rowCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  rowTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  title: { flex: 1, color: "#0f172a", fontWeight: "700", fontSize: 13 },
  date: { color: "#64748b", fontSize: 12 },
  meta: { color: "#64748b", fontSize: 12, marginTop: 6, marginBottom: 8 },
  track: { height: 8, borderRadius: 999, backgroundColor: "#e2e8f0", overflow: "hidden" },
  fill: { height: 8, borderRadius: 999, backgroundColor: branding.colors.primary },
});
