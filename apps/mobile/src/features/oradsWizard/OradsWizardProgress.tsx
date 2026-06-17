import { StyleSheet, View } from "react-native";

type Props = {
  current: number;
  total: number;
  rtl?: boolean;
};

export default function OradsWizardProgress({ current, total, rtl }: Props) {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <View style={[styles.track, rtl && styles.trackRtl]}>
      <View style={[styles.fill, { width: `${pct}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
    marginTop: 8,
    marginBottom: 4,
  },
  trackRtl: {
    transform: [{ scaleX: -1 }],
  },
  fill: {
    height: "100%",
    backgroundColor: "#2563EB",
    borderRadius: 999,
  },
});
