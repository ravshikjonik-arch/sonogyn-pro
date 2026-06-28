import { StyleSheet, Text, View } from "react-native";

import { CLINICAL_WEB_BLOCK_MESSAGE_RU } from "../lib/security/clinicalAccessGuard";

export default function ClinicalWebBlockScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Клинический доступ ограничен</Text>
      <Text style={styles.body}>{CLINICAL_WEB_BLOCK_MESSAGE_RU}</Text>
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
  body: { fontSize: 15, lineHeight: 22, color: "#44403c" },
});
