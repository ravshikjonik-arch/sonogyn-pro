import { StyleSheet, Text, TextInput, View } from "react-native";
import { computeFunctionalProlapsePercent } from "../../gynecology/prolapseLogic";
import i18n from "../../i18n";
import { theme } from "../../theme";

type Props = {
  vRest: string;
  vValsalva: string;
  onChangeRest: (v: string) => void;
  onChangeValsalva: (v: string) => void;
};

export default function FunctionalCalculator({ vRest, vValsalva, onChangeRest, onChangeValsalva }: Props) {
  const r = Number(vRest.replace(",", "."));
  const v = Number(vValsalva.replace(",", "."));
  const pct = computeFunctionalProlapsePercent(r, v);
  const pctText =
    pct == null ? "—" : i18n.t("prolapse_functional_line", { pct: Math.round(pct * 10) / 10 });

  return (
    <View style={styles.wrap}>
      <Text style={styles.sub}>{i18n.t("prolapse_functional_subtitle")}</Text>
      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.label}>V_rest</Text>
          <TextInput
            value={vRest}
            onChangeText={onChangeRest}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#9ca3af"
            style={styles.input}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>V_valsalva</Text>
          <TextInput
            value={vValsalva}
            onChangeText={onChangeValsalva}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor="#9ca3af"
            style={styles.input}
          />
        </View>
      </View>
      <View style={styles.out}>
        <Text style={styles.outLabel}>{i18n.t("prolapse_functional_output_label")}</Text>
        <Text style={styles.outValue}>{pctText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.spacing.md },
  sub: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 20 },
  row: { flexDirection: "row", gap: 10 },
  field: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    ...theme.shadow.card,
  },
  label: { fontSize: 12, fontWeight: "700", color: theme.colors.textSecondary, marginBottom: 6 },
  input: { fontSize: 24, fontWeight: "800", color: theme.colors.text },
  out: {
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    backgroundColor: "#0f172a",
  },
  outLabel: { fontSize: 12, color: "#94a3b8", fontWeight: "600" },
  outValue: { fontSize: 22, fontWeight: "800", color: "#fff", marginTop: 6 },
});
