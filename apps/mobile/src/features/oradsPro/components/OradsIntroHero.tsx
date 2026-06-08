import { Pressable, StyleSheet, Text, View } from "react-native";

import { ORADS_VERSION_LABEL } from "../oradsReference";

type Props = {
  onContinue: () => void;
};

/** Заставка O-RADS — картинка яичника вместо текстового RADS disclaimer */
export default function OradsIntroHero({ onContinue }: Props) {
  return (
    <Pressable style={styles.card} onPress={onContinue}>
      <View style={styles.iconBox}>
        <Text style={styles.iconGlyph}>◉</Text>
      </View>
      <Text style={styles.title}>O-RADS US</Text>
      <Text style={styles.sub}>Калькулятор · {ORADS_VERSION_LABEL}</Text>
      <Text style={styles.hint}>Нажмите, чтобы открыть оценку O-RADS 0–5 и IOTA</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 20,
    backgroundColor: "#6d28d9",
    padding: 24,
    alignItems: "center",
  },
  iconBox: {
    width: 88,
    height: 88,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  iconGlyph: { fontSize: 42, color: "#f9a8d4" },
  title: { fontSize: 26, fontWeight: "900", color: "#fff" },
  sub: { marginTop: 4, fontSize: 11, color: "#e9d5ff", textAlign: "center" },
  hint: { marginTop: 16, fontSize: 13, fontWeight: "700", color: "#fff" },
});
