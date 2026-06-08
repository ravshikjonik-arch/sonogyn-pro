import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import i18n from "../i18n";

type Props = {
  description: string;
  keywords: string[];
  example: string;
  whyText: string;
  onUseInCase: () => void;
};

function HighlightedText({ text, keywords }: { text: string; keywords: string[] }) {
  let rendered = text;
  const marks = keywords.filter(Boolean).sort((a, b) => b.length - a.length);
  for (const key of marks) {
    rendered = rendered.replace(key, `[[${key}]]`);
  }
  const chunks = rendered.split(/(\[\[.*?\]\])/g).filter(Boolean);

  return (
    <Text style={styles.descriptionText}>
      {chunks.map((chunk, idx) => {
        if (chunk.startsWith("[[") && chunk.endsWith("]]")) {
          return (
            <Text key={`${chunk}-${idx}`} style={styles.highlight}>
              {chunk.slice(2, -2)}
            </Text>
          );
        }
        return <Text key={`${chunk}-${idx}`}>{chunk}</Text>;
      })}
    </Text>
  );
}

export default function DescriptionBlock({
  description,
  keywords,
  example,
  whyText,
  onUseInCase,
}: Props) {
  async function onCopy() {
    await Clipboard.setStringAsync(description);
    Alert.alert(i18n.t("success"), i18n.t("description_copied"));
  }

  function onWhy() {
    Alert.alert(i18n.t("description_why_title"), whyText);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{i18n.t("description_auto_title")}</Text>
        <Pressable onPress={onWhy} style={styles.whyBtn}>
          <Text style={styles.whyBtnText}>?</Text>
        </Pressable>
      </View>

      <HighlightedText text={description} keywords={keywords} />
      <Text style={styles.hintLabel}>{i18n.t("description_example_label")}</Text>
      <Text style={styles.hintText}>{example}</Text>

      <View style={styles.actions}>
        <Pressable style={styles.secondaryBtn} onPress={() => void onCopy()}>
          <Text style={styles.secondaryBtnText}>{i18n.t("copy")}</Text>
        </Pressable>
        <Pressable style={styles.primaryBtn} onPress={onUseInCase}>
          <Text style={styles.primaryBtnText}>{i18n.t("use_in_case")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#dbeafe",
    backgroundColor: "#f8fbff",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  whyBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  whyBtnText: { color: "#1d4ed8", fontWeight: "700" },
  descriptionText: { color: "#334155", lineHeight: 20 },
  highlight: { color: "#0f766e", fontWeight: "700", backgroundColor: "#ccfbf1" },
  hintLabel: { color: "#475569", fontSize: 12, fontWeight: "600" },
  hintText: { color: "#64748b", fontSize: 12 },
  actions: { flexDirection: "row", gap: 8, marginTop: 2 },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  secondaryBtnText: { color: "#0f172a", fontWeight: "600" },
  primaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#0f766e",
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: "center",
    backgroundColor: "#0f766e",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
});
