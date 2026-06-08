import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { branding } from "../../config/branding";

type Props = {
  onOpenORADS: () => void;
  onOpenProlapse: () => void;
};

function CalculatorCard({
  title,
  subtitle,
  icon,
  accent,
  action,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <View style={[styles.calcCard, { borderColor: `${accent}44` }]}>
      <Text style={[styles.icon, { color: accent }]}>{icon}</Text>
      <Text style={styles.calcTitle}>{title}</Text>
      <Text style={styles.calcSubtitle}>{subtitle}</Text>
      <Pressable style={[styles.actionBtn, { backgroundColor: accent }]} onPress={onPress}>
        <Text style={styles.actionText}>{action}</Text>
      </Pressable>
    </View>
  );
}

export default function ScaleNavigator({ onOpenORADS, onOpenProlapse }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Навигатор по шкалам</Text>
      <Text style={styles.section}>Основные калькуляторы</Text>
      <View style={styles.grid}>
        <CalculatorCard
          title="Дерево решений O-RADS"
          subtitle="Стандартизированная оценка риска"
          icon="◍"
          accent={branding.accents.orads}
          action="Запустить"
          onPress={onOpenORADS}
        />
        <CalculatorCard
          title="Пролапс таза / POP-Q"
          subtitle="Быстрая стадировка"
          icon="◌"
          accent={branding.accents.prolapse}
          action="Стадировать"
          onPress={onOpenProlapse}
        />
      </View>
      <Text style={styles.section}>Оценка рисков</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {[
          { label: "Эндометриоз", icon: "◎" },
          { label: "Матка", icon: "◐" },
          { label: "Лимфоузлы", icon: "◍" },
        ].map((chip) => (
          <View key={chip.label} style={styles.chip}>
            <Text style={styles.chipIcon}>{chip.icon}</Text>
            <Text style={styles.chipText}>{chip.label}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  title: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  section: { fontSize: 13, fontWeight: "700", color: "#334155" },
  grid: { flexDirection: "row", gap: 12 },
  calcCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    shadowColor: "#0f172a",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  icon: { fontSize: 18, fontWeight: "800" },
  calcTitle: { marginTop: 4, color: "#0f172a", fontWeight: "800", fontSize: 14 },
  calcSubtitle: { marginTop: 4, color: "#64748b", fontSize: 12, minHeight: 34 },
  actionBtn: { marginTop: 10, borderRadius: 10, paddingVertical: 8, alignItems: "center" },
  actionText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  chips: { gap: 8, paddingRight: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipIcon: { color: branding.colors.primary, fontSize: 12, fontWeight: "700" },
  chipText: { color: "#334155", fontSize: 12, fontWeight: "700" },
});
