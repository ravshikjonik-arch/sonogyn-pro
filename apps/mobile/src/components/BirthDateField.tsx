import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import {
  ageFromBirthDateIso,
  birthDateErrorMessage,
  birthDatePickerBounds,
  formatAgeYearsRu,
  formatBirthDateRu,
  isoFromDate,
  parseIsoBirthDate,
  validateBirthDateIso,
} from "@repo/types";

type Props = {
  value: string;
  onChange: (iso: string) => void;
  label?: string;
};

const { minIso, maxIso, defaultIso } = birthDatePickerBounds();

function dateFromIso(iso: string): Date {
  return parseIsoBirthDate(iso) ?? parseIsoBirthDate(defaultIso)!;
}

export function BirthDateField({ value, onChange, label = "Дата рождения" }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerDate = useMemo(() => dateFromIso(value || defaultIso), [value]);
  const minDate = useMemo(() => dateFromIso(minIso), []);
  const maxDate = useMemo(() => dateFromIso(maxIso), []);

  const validationError = value ? validateBirthDateIso(value) : null;
  const age = value && !validationError ? ageFromBirthDateIso(value) : null;
  const displayRu = value && !validationError ? formatBirthDateRu(value) : null;

  function onPickerChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === "android") setShowPicker(false);
    if (event.type === "dismissed" || !selected) return;
    onChange(isoFromDate(selected));
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={styles.trigger}
        accessibilityRole="button"
        accessibilityLabel="Выбрать дату рождения"
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.triggerText}>
          {displayRu ?? "Нажмите, чтобы выбрать дату"}
        </Text>
      </Pressable>

      {showPicker ? (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          minimumDate={minDate}
          maximumDate={maxDate}
          onChange={onPickerChange}
        />
      ) : null}

      {Platform.OS === "ios" && showPicker ? (
        <Pressable style={styles.doneBtn} onPress={() => setShowPicker(false)}>
          <Text style={styles.doneBtnText}>Готово</Text>
        </Pressable>
      ) : null}

      {displayRu && age !== null ? (
        <View style={styles.preview}>
          <Text style={styles.previewLine}>Дата рождения: {displayRu}</Text>
          <Text style={styles.previewLine}>Возраст: {formatAgeYearsRu(age)}</Text>
        </View>
      ) : validationError ? (
        <Text style={styles.error} accessibilityRole="alert">
          {birthDateErrorMessage(validationError)}
        </Text>
      ) : (
        <Text style={styles.hint}>Выберите дату — возраст посчитается автоматически.</Text>
      )}
    </View>
  );
}

/** Read-only DOB + age for profile screens. */
export function BirthDateDisplay({
  iso,
  birthYear,
}: {
  iso?: string | null;
  birthYear?: number | null;
}) {
  const age = iso ? ageFromBirthDateIso(iso) : null;
  const display = iso ? formatBirthDateRu(iso) : null;

  if (!display && !birthYear) return null;

  return (
    <View style={styles.displayBox}>
      {display ? (
        <>
          <Text style={styles.displayLine}>Дата рождения: {display}</Text>
          {age !== null ? (
            <Text style={styles.displayAge}>Возраст: {formatAgeYearsRu(age)}</Text>
          ) : null}
        </>
      ) : birthYear ? (
        <>
          <Text style={styles.displayLine}>Год {birthYear}</Text>
          <Text style={styles.hint}>Уточните полную дату при регистрации или в веб-профиле.</Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: "600", color: "#334155" },
  trigger: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  triggerText: { fontSize: 15, color: "#0f172a", fontWeight: "500" },
  preview: { gap: 2 },
  previewLine: { fontSize: 14, fontWeight: "600", color: "#0f766e" },
  hint: { fontSize: 12, color: "#64748b" },
  error: { fontSize: 12, color: "#dc2626", fontWeight: "600" },
  doneBtn: {
    alignSelf: "flex-end",
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  doneBtnText: { color: "#1d4ed8", fontWeight: "700" },
  displayBox: {
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    gap: 4,
  },
  displayLine: { fontSize: 14, fontWeight: "600", color: "#0f172a" },
  displayAge: { fontSize: 14, fontWeight: "600", color: "#0f766e" },
});
