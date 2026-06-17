import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  imageSlot?: React.ReactNode;
  rtl?: boolean;
};

/** Large tap target for one-handed use during scanning. */
export default function OradsOptionCard({ label, selected, onPress, imageSlot, rtl }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.pressed,
        rtl && styles.cardRtl,
      ]}
    >
      {imageSlot ? <View style={styles.imageSlot}>{imageSlot}</View> : null}
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 72,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    justifyContent: "center",
  },
  cardRtl: {
    alignItems: "flex-end",
  },
  cardSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#EFF6FF",
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  imageSlot: {
    marginBottom: 8,
    minHeight: 88,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    lineHeight: 22,
  },
  labelSelected: {
    color: "#1D4ED8",
  },
});
