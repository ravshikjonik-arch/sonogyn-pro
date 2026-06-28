import * as Clipboard from "expo-clipboard";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { OradsNosologyAtlasEntry } from "@repo/orads-us";

type Props = {
  entry: OradsNosologyAtlasEntry;
  imageUri: string | null;
};

export default function OradsNosologyPreview({ entry, imageUri }: Props) {
  async function copyProtocol() {
    await Clipboard.setStringAsync(entry.protocolText);
    Alert.alert("Скопировано", "Формулировка добавлена в буфер обмена");
  }

  return (
    <View style={styles.wrap}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" accessibilityLabel={entry.imageAlt} />
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>Эхограмма доступна при подключении к web-атласу</Text>
        </View>
      )}
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={styles.titles}>
            <Text style={styles.title}>{entry.titleRu}</Text>
            <Text style={styles.hint}>{entry.oradsHint}</Text>
          </View>
          <Pressable style={styles.copyBtn} onPress={() => void copyProtocol()}>
            <Text style={styles.copyBtnText}>В протокол</Text>
          </Pressable>
        </View>
        <Text style={styles.protocol}>{entry.protocolText}</Text>
        <Text style={styles.disclaimer}>Учебная эхограмма · не заменяет заключение врача</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#a7f3d0",
    backgroundColor: "#ecfdf5",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 180,
    backgroundColor: "#0f172a",
  },
  imagePlaceholder: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "#f1f5f9",
  },
  imagePlaceholderText: { color: "#64748b", fontSize: 12, textAlign: "center" },
  body: { padding: 12, gap: 8 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
  titles: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: "700", color: "#064e3b" },
  hint: { fontSize: 11, color: "#047857" },
  copyBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  copyBtnText: { fontSize: 12, fontWeight: "600", color: "#0f172a" },
  protocol: { fontSize: 12, lineHeight: 18, color: "#334155" },
  disclaimer: { fontSize: 10, color: "#64748b" },
});
