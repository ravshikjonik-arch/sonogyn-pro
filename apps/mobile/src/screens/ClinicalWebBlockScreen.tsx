import { Platform, StyleSheet, Text, View } from "react-native";

import {
  CLINICAL_WEB_BLOCK_HINTS_RU,
  CLINICAL_WEB_BLOCK_MESSAGE_RU,
  getClinicalAccessRuntimeLabel,
} from "../lib/security/clinicalAccessGuard";

export default function ClinicalWebBlockScreen() {
  return (
    <View style={styles.root} accessibilityRole="alert">
      <Text style={styles.title}>Клинический доступ ограничен</Text>
      <Text style={styles.body}>{CLINICAL_WEB_BLOCK_MESSAGE_RU}</Text>
      {CLINICAL_WEB_BLOCK_HINTS_RU.map((hint) => (
        <Text key={hint.slice(0, 24)} style={styles.hint}>
          • {hint}
        </Text>
      ))}
      {__DEV__ ? (
        <Text style={styles.dev} accessibilityLabel="Debug runtime">
          Debug: {getClinicalAccessRuntimeLabel()}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fef2f2",
  },
  title: { fontSize: 20, fontWeight: "800", color: "#991b1b", marginBottom: 12 },
  body: { fontSize: 15, lineHeight: 22, color: "#44403c", marginBottom: 16 },
  hint: { fontSize: 14, lineHeight: 20, color: "#57534e", marginBottom: 10 },
  dev: { marginTop: 16, fontSize: 12, color: "#78716c", fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
});
