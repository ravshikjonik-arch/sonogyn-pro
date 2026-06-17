import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { OradsAtlasPreview } from "./resolveOradsAtlas";

type Props = {
  preview: OradsAtlasPreview | null;
  caption?: string;
  onOpenWeb?: () => void;
};

export default function OradsAtlasImage({ preview, caption, onOpenWeb }: Props) {
  if (!preview) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Эхограмма подключится при доступе к web-атласу.</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Image
        source={{ uri: preview.uri }}
        style={styles.image}
        resizeMode="contain"
        accessibilityLabel={caption ?? "O-RADS echogram"}
      />
      {preview.teachingHint ? <Text style={styles.hint}>{preview.teachingHint}</Text> : null}
      {onOpenWeb ? (
        <Pressable style={styles.link} onPress={onOpenWeb}>
          <Text style={styles.linkText}>Открыть в библиотеке эхограмм</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#0f172a",
  },
  hint: { color: "#334155", fontSize: 12, lineHeight: 17 },
  placeholder: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    padding: 12,
  },
  placeholderText: { color: "#64748b", fontSize: 12 },
  link: { alignSelf: "flex-start" },
  linkText: { color: "#2563EB", fontWeight: "700", fontSize: 13 },
});
