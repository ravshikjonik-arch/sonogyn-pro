import { StyleSheet, Text, View } from "react-native";

import type { CervixTheme } from "../useCervixTheme";

type Props = {
  text: string;
  theme: CervixTheme;
};

export function DisclaimerBanner({ text, theme }: Props) {
  return (
    <View
      style={[
        styles.box,
        { backgroundColor: theme.colors.warningBg, borderColor: theme.colors.warningBorder },
      ]}
    >
      <Text style={[styles.title, { color: theme.colors.warningText }]}>Образовательная поддержка</Text>
      <Text style={[styles.body, { color: theme.colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  title: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  body: { fontSize: 13, lineHeight: 18, marginTop: 4 },
});
