import { Pressable, StyleSheet, Text, TextInput, useColorScheme, View } from "react-native";
import type { FieldDefinition } from "../types";
import type { MyometriumLesionType, OvaryIotaType } from "../types";

type Props = {
  t: (key: string) => string;
  fields: FieldDefinition[];
  values: Record<string, string>;
  onChange: (key: string, val: string) => void;
  onCalculate: () => void;
  errors: string[];
  warnings: string[];
  organExtras?: {
    myometriumType?: MyometriumLesionType;
    onMyometriumType?: (v: MyometriumLesionType) => void;
    ovaryIotaType?: OvaryIotaType;
    onOvaryIotaType?: (v: OvaryIotaType) => void;
  };
  patientId: string;
  patientName: string;
  onPatientId: (v: string) => void;
  onPatientName: (v: string) => void;
};

function ChipRow<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <View style={styles.chipBlock}>
      <Text style={styles.chipLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((o) => (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            style={[styles.chip, value === o.id && styles.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: value === o.id }}
          >
            <Text style={[styles.chipText, value === o.id && styles.chipTextActive]}>{o.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function InputForm({
  t,
  fields,
  values,
  onChange,
  onCalculate,
  errors,
  warnings,
  organExtras,
  patientId,
  patientName,
  onPatientId,
  onPatientName,
}: Props) {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  return (
    <View style={styles.wrap}>
      <Text style={styles.section}>{t("elasto_patient_id")}</Text>
      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        value={patientId}
        onChangeText={onPatientId}
        placeholder="ID"
        placeholderTextColor="#94a3b8"
        accessibilityLabel={t("elasto_patient_id")}
      />
      <Text style={styles.section}>{t("elasto_patient_name")}</Text>
      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        value={patientName}
        onChangeText={onPatientName}
        placeholder="ФИО"
        placeholderTextColor="#94a3b8"
        accessibilityLabel={t("elasto_patient_name")}
      />

      {organExtras?.onMyometriumType ? (
        <ChipRow
          label={t("elasto_myometrium_type_label")}
          value={organExtras.myometriumType ?? "unclear"}
          onChange={organExtras.onMyometriumType}
          options={[
            { id: "fibroid", label: t("elasto_type_fibroid") },
            { id: "adenomyosis", label: t("elasto_type_adenomyosis") },
            { id: "unclear", label: t("elasto_type_unclear") },
          ]}
        />
      ) : null}

      {organExtras?.onOvaryIotaType ? (
        <ChipRow
          label={t("elasto_ovary_type_label")}
          value={organExtras.ovaryIotaType ?? "cyst"}
          onChange={organExtras.onOvaryIotaType}
          options={[
            { id: "cyst", label: t("elasto_iota_cyst") },
            { id: "endometrioma", label: t("elasto_iota_endometrioma") },
            { id: "solid", label: t("elasto_iota_solid") },
          ]}
        />
      ) : null}

      {fields.map((f) => (
        <View key={f.key} style={styles.field}>
          <Text style={styles.label}>
            {t(f.labelKey)}
            {f.unit ? ` (${f.unit})` : ""}
            {f.optional ? " · опц." : ""}
          </Text>
          <TextInput
            style={[styles.input, isDark && styles.inputDark]}
            value={values[f.key] ?? ""}
            onChangeText={(v) => onChange(f.key, v)}
            keyboardType={f.keyboard === "numeric" ? "number-pad" : "decimal-pad"}
            placeholder={t(f.hintKey)}
            placeholderTextColor="#94a3b8"
            accessibilityLabel={t(f.labelKey)}
          />
          <Text style={styles.hint}>{t(f.hintKey)}</Text>
        </View>
      ))}

      {errors.map((e) => (
        <Text key={e} style={styles.error}>
          {e}
        </Text>
      ))}
      {warnings.map((w) => (
        <Text key={w} style={styles.warn}>
          ⚠ {w}
        </Text>
      ))}

      <Pressable style={styles.btn} onPress={onCalculate} accessibilityRole="button">
        <Text style={styles.btnText}>{t("elasto_calculate")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  section: { fontSize: 12, fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8 },
  field: { gap: 4 },
  label: { fontSize: 14, fontWeight: "600", color: "#0F2744" },
  hint: { fontSize: 11, color: "#64748b" },
  input: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#0F2744",
  },
  inputDark: { backgroundColor: "#0f172a", borderColor: "#334155", color: "#f8fafc" },
  btn: {
    marginTop: 8,
    backgroundColor: "#6D28D9",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  error: { color: "#DC2626", fontSize: 13 },
  warn: { color: "#D97706", fontSize: 13 },
  chipBlock: { gap: 8, marginVertical: 4 },
  chipLabel: { fontSize: 13, fontWeight: "600", color: "#475569" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#fff",
  },
  chipActive: { borderColor: "#6D28D9", backgroundColor: "#EDE9FE" },
  chipText: { fontSize: 13, color: "#334155", fontWeight: "600" },
  chipTextActive: { color: "#5B21B6" },
});
