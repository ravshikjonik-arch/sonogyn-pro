import { Pressable, StyleSheet, Text } from "react-native";

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export default function SelectChip({ label, selected, onPress }: Props) {
  return (
    <Pressable style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]} onPress={onPress}>
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  chipSelected: {
    borderColor: "#2563EB",
    backgroundColor: "#2563EB",
  },
  text: {
    color: "#0f172a",
    fontWeight: "600",
    fontSize: 13,
  },
  textSelected: {
    color: "#fff",
  },
  pressed: {
    opacity: 0.88,
  },
});
