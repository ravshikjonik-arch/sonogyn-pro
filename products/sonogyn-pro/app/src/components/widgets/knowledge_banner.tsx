import { Pressable, StyleSheet, Text, View } from "react-native";
import { branding } from "../../config/branding";

type Props = {
  onPress: () => void;
};

export default function KnowledgeBanner({ onPress }: Props) {
  return (
    <Pressable style={styles.banner} onPress={onPress}>
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>▤</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Библиотека O-RADS</Text>
        <Text style={styles.subtitle}>Что нового в O-RADS v2022?</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: branding.colors.bannerBorder,
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowColor: "#0f172a",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { color: branding.colors.primary, fontWeight: "800", fontSize: 16 },
  title: { color: "#0f172a", fontWeight: "800", fontSize: 14 },
  subtitle: { color: "#475569", fontSize: 12, marginTop: 2 },
  arrow: { color: branding.colors.primary, fontSize: 22, fontWeight: "700" },
});
