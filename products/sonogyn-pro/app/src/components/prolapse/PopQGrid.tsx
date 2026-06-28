import { useState } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { POINT_HINTS, POPQ_VALUE_OPTIONS } from "@repo/medical-calculations/popq";
import type { PopQPointKey } from "@repo/medical-calculations/popq";

import i18n from "../../i18n";
import { theme } from "../../theme";

type Props = {
  values: Record<PopQPointKey, string>;
  uterusPresent: boolean;
  onChange: (key: PopQPointKey, value: string) => void;
  dNaLabel: string;
  pickValueLabel: string;
};

function ValuePickerModal({
  visible,
  pointKey,
  value,
  onSelect,
  onClose,
  pickValueLabel,
}: {
  visible: boolean;
  pointKey: PopQPointKey | null;
  value: string;
  onSelect: (v: string) => void;
  onClose: () => void;
  pickValueLabel: string;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>
            {pointKey ? `${pointKey} · ${pickValueLabel}` : pickValueLabel}
          </Text>
          {pointKey ? <Text style={styles.modalHint}>{POINT_HINTS[pointKey]}</Text> : null}
          <ScrollView style={styles.optionList} keyboardShouldPersistTaps="handled">
            <Pressable
              style={({ pressed }) => [styles.optionRow, pressed && styles.pressed]}
              onPress={() => {
                onSelect("");
                onClose();
              }}
            >
              <Text style={styles.optionText}>—</Text>
            </Pressable>
            {POPQ_VALUE_OPTIONS.map((n) => (
              <Pressable
                key={n}
                style={({ pressed }) => [
                  styles.optionRow,
                  value === String(n) && styles.optionRowOn,
                  pressed && styles.pressed,
                ]}
                onPress={() => {
                  onSelect(String(n));
                  onClose();
                }}
              >
                <Text style={[styles.optionText, value === String(n) && styles.optionTextOn]}>
                  {n} {i18n.t("prolapse_cm")}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Pressable style={styles.modalClose} onPress={onClose}>
            <Text style={styles.modalCloseText}>{i18n.t("continue")}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function GridCell({
  pointKey,
  value,
  onPress,
}: {
  pointKey: PopQPointKey;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.cell, pressed && styles.pressed]} onPress={onPress}>
      <View style={styles.cellHeader}>
        <Text style={styles.cellKey}>{pointKey}</Text>
        <Pressable
          hitSlop={8}
          onPress={() => Alert.alert(pointKey, POINT_HINTS[pointKey])}
          accessibilityRole="button"
          accessibilityLabel={`Подсказка ${pointKey}`}
        >
          <Text style={styles.hintBtn}>?</Text>
        </Pressable>
      </View>
      <Text style={styles.cellValue}>{value ? `${value} ${i18n.t("prolapse_cm")}` : "—"}</Text>
      <Text style={styles.cellHint} numberOfLines={2}>
        {POINT_HINTS[pointKey]}
      </Text>
    </Pressable>
  );
}

function NaCell({ label }: { label: string }) {
  return (
    <View style={styles.naCell}>
      <Text style={styles.naText}>{label}</Text>
    </View>
  );
}

/** Сетка 3×3 в духе AUGS POP-Q Tool. */
export default function PopQGrid({ values, uterusPresent, onChange, dNaLabel, pickValueLabel }: Props) {
  const [pickerKey, setPickerKey] = useState<PopQPointKey | null>(null);

  function openPicker(key: PopQPointKey) {
    setPickerKey(key);
  }

  return (
    <>
      <View style={styles.grid}>
        <View style={styles.row}>
          <GridCell pointKey="Aa" value={values.Aa} onPress={() => openPicker("Aa")} />
          <GridCell pointKey="Ba" value={values.Ba} onPress={() => openPicker("Ba")} />
          <GridCell pointKey="C" value={values.C} onPress={() => openPicker("C")} />
        </View>
        <View style={styles.row}>
          <GridCell pointKey="GH" value={values.GH} onPress={() => openPicker("GH")} />
          <GridCell pointKey="PB" value={values.PB} onPress={() => openPicker("PB")} />
          <GridCell pointKey="TVL" value={values.TVL} onPress={() => openPicker("TVL")} />
        </View>
        <View style={styles.row}>
          <GridCell pointKey="Ap" value={values.Ap} onPress={() => openPicker("Ap")} />
          <GridCell pointKey="Bp" value={values.Bp} onPress={() => openPicker("Bp")} />
          {uterusPresent ? (
            <GridCell pointKey="D" value={values.D} onPress={() => openPicker("D")} />
          ) : (
            <NaCell label={dNaLabel} />
          )}
        </View>
      </View>

      <ValuePickerModal
        visible={pickerKey !== null}
        pointKey={pickerKey}
        value={pickerKey ? values[pickerKey] : ""}
        pickValueLabel={pickValueLabel}
        onSelect={(v) => {
          if (pickerKey) onChange(pickerKey, v);
        }}
        onClose={() => setPickerKey(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 8 },
  row: { flexDirection: "row", gap: 8 },
  cell: {
    flex: 1,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: "#fff",
    padding: 8,
    minHeight: 88,
    ...theme.shadow.card,
  },
  cellHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cellKey: { fontSize: 13, fontWeight: "900", color: theme.colors.primary },
  hintBtn: { fontSize: 12, color: theme.colors.textSecondary, fontWeight: "700" },
  cellValue: { marginTop: 6, fontSize: 15, fontWeight: "800", color: theme.colors.text },
  cellHint: { marginTop: 4, fontSize: 9, lineHeight: 12, color: theme.colors.textSecondary },
  naCell: {
    flex: 1,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    padding: 8,
    minHeight: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  naText: { fontSize: 10, color: "#64748b", textAlign: "center", lineHeight: 14 },
  pressed: { opacity: 0.88 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: theme.spacing.md,
    maxHeight: "72%",
    gap: 8,
  },
  modalTitle: { fontSize: 17, fontWeight: "800", color: theme.colors.text },
  modalHint: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 18 },
  optionList: { maxHeight: 360 },
  optionRow: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  optionRowOn: { backgroundColor: "#E8F2FC" },
  optionText: { fontSize: 16, fontWeight: "600", color: theme.colors.text },
  optionTextOn: { color: theme.colors.primary, fontWeight: "800" },
  modalClose: {
    alignSelf: "center",
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  modalCloseText: { color: theme.colors.primary, fontWeight: "800", fontSize: 15 },
});
