import * as Clipboard from "expo-clipboard";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  View,
} from "react-native";
import { generateReport } from "../reporting/generateReport";
import type { ReportInput } from "../reporting/ovaryReportInput";
import { exportReportPdf } from "../reporting/exportReportPdf";
import i18n from "../i18n";
import { theme } from "../theme";

type Props = {
  input: ReportInput;
  onSaveToCase?: (text: string) => void;
};

export default function ReportBlock({ input, onSaveToCase }: Props) {
  const generated = useMemo(() => generateReport(input), [input]);
  const [text, setText] = useState(generated);
  const [pdfBusy, setPdfBusy] = useState(false);

  useEffect(() => {
    setText(generated);
  }, [generated]);

  async function handleCopy() {
    await Clipboard.setStringAsync(text);
    const msg = i18n.t("report_copy_done");
    if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert(msg);
  }

  async function handlePdf() {
    try {
      setPdfBusy(true);
      await exportReportPdf({ title: i18n.t("report_section_title"), bodyText: text });
    } catch (e) {
      Alert.alert(i18n.t("error"), e instanceof Error ? e.message : i18n.t("report_pdf_error"));
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{i18n.t("report_section_title")}</Text>
      <TextInput
        value={text}
        onChangeText={setText}
        multiline
        textAlignVertical="top"
        style={styles.input}
        placeholder={i18n.t("report_editable_hint")}
        placeholderTextColor="#9ca3af"
      />
      <View style={styles.row}>
        <Pressable
          style={({ pressed }) => [styles.btnSecondary, pressed && styles.pressed]}
          onPress={handleCopy}
        >
          <Text style={styles.btnSecondaryText}>{i18n.t("report_copy")}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btnSecondary, pressed && styles.pressed, pdfBusy && styles.disabled]}
          onPress={handlePdf}
          disabled={pdfBusy}
        >
          {pdfBusy ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <Text style={styles.btnSecondaryText}>{i18n.t("report_export_pdf")}</Text>
          )}
        </Pressable>
      </View>
      {onSaveToCase ? (
        <Pressable
          style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed]}
          onPress={() => onSaveToCase(text)}
        >
          <Text style={styles.btnPrimaryText}>{i18n.t("report_save_case")}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#C8E6C9",
    backgroundColor: "#f8fdf8",
    gap: 12,
  },
  title: { fontSize: 17, fontWeight: "800", color: theme.colors.text },
  input: {
    minHeight: 180,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.text,
    backgroundColor: "#fff",
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  btnPrimary: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnPrimaryText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  btnSecondary: {
    flex: 1,
    minWidth: "40%",
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  btnSecondaryText: { color: theme.colors.primary, fontWeight: "800", fontSize: 14 },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.55 },
});
