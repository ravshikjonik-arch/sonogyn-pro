import { Pressable, StyleSheet, Text, View } from "react-native";
import type { QuickStage } from "../../gynecology/prolapseLogic";
import i18n from "../../i18n";
import { theme } from "../../theme";

const STAGES: QuickStage[] = [1, 2, 3, 4];

type Props = {
  value: QuickStage | null;
  onChange: (s: QuickStage) => void;
};

export default function QuickAssessment({ value, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.stepLabel}>{i18n.t("prolapse_quick_step1")}</Text>
      <View style={styles.row}>
        {STAGES.map((s) => {
          const active = value === s;
          return (
            <Pressable
              key={s}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && styles.pressed,
              ]}
              onPress={() => onChange(s)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {i18n.t(`prolapse_quick_stage_${s}_short`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {value != null ? (
        <View style={styles.descCard}>
          <Text style={styles.descTitle}>{i18n.t(`prolapse_quick_stage_${value}_short`)}</Text>
          <Text style={styles.descBody}>{i18n.t(`prolapse_quick_stage_${value}_desc`)}</Text>
        </View>
      ) : (
        <Text style={styles.hint}>{i18n.t("prolapse_quick_pick_hint")}</Text>
      )}
      {value != null ? (
        <View style={styles.outCard}>
          <Text style={styles.outLabel}>{i18n.t("prolapse_quick_output_label")}</Text>
          <Text style={styles.outValue}>{i18n.t("prolapse_quick_line", { stage: value })}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.spacing.md },
  stepLabel: { fontSize: 13, fontWeight: "700", color: theme.colors.textSecondary, letterSpacing: 0.3 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  chipActive: { borderColor: theme.colors.primary, backgroundColor: "#E8F2FC" },
  chipText: { fontSize: 15, fontWeight: "700", color: theme.colors.text },
  chipTextActive: { color: theme.colors.primary },
  pressed: { opacity: 0.92 },
  descCard: {
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  descTitle: { fontSize: 16, fontWeight: "800", color: theme.colors.text, marginBottom: 6 },
  descBody: { fontSize: 15, lineHeight: 22, color: theme.colors.textSecondary },
  hint: { fontSize: 14, color: theme.colors.textSecondary },
  outCard: {
    marginTop: 4,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    backgroundColor: "#0f172a",
  },
  outLabel: { fontSize: 12, color: "#94a3b8", fontWeight: "600" },
  outValue: { fontSize: 22, fontWeight: "800", color: "#fff", marginTop: 6 },
});
