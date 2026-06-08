import { Pressable, Text } from "react-native";
import { gynRouterStyles as s } from "../gynRouterStyles";

export function GynBackToHub({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={s.backBtn} onPress={onPress}>
      <Text style={s.backBtnText}>← К разделу «Для гинеколога»</Text>
    </Pressable>
  );
}
