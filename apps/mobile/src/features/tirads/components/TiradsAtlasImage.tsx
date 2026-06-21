import { useEffect, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import type { TiradsAtlasPreview } from "./resolveTiradsAtlas";

type Props = {
  preview: TiradsAtlasPreview | null;
};

export default function TiradsAtlasImage({ preview }: Props) {
  const [uri, setUri] = useState(preview?.uri ?? null);

  useEffect(() => {
    setUri(preview?.uri ?? null);
  }, [preview?.uri]);

  if (!preview) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Эхограмма — при подключении к web-атласу.</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: uri ?? preview.uri }}
      style={styles.image}
      resizeMode="contain"
      accessibilityLabel={preview.label}
      onError={() => {
        if (uri !== preview.fallbackUri) setUri(preview.fallbackUri);
      }}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    backgroundColor: "#0f172a",
  },
  placeholder: {
    height: 140,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  placeholderText: { color: "#64748b", fontSize: 12, textAlign: "center" },
});
