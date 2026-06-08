import { memo, useRef } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { CasePreview } from "../features/case/types";
import i18n from "../i18n";
import { theme } from "../theme";

function organLabel(v: CasePreview["organ"]) {
  if (v === "breast") return i18n.t("breast");
  if (v === "ovary") return i18n.t("ovary");
  if (v === "uterus") return i18n.t("uterus");
  return i18n.t("lymph_node");
}

function CaseCard({
  item,
  onPress,
}: {
  item: CasePreview;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  function animatePress(toValue: number) {
    Animated.timing(scale, {
      toValue,
      duration: theme.motion.fast,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={styles.card}
        onPressIn={() => animatePress(0.97)}
        onPressOut={() => animatePress(1)}
        onPress={onPress}
      >
      <View style={styles.mediaWrap}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.media} />
        ) : (
          <View style={styles.thumbStub}>
            <Text style={styles.thumbStubText}>US</Text>
          </View>
        )}
        <View style={styles.overlay}>
          <Text style={styles.overlayClass}>{item.result || "—"}</Text>
          <Text style={styles.overlayOrgan}>{organLabel(item.organ)}</Text>
        </View>
      </View>
      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.description}>
          {item.description || i18n.t("no_description")}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>💬 {item.commentsCount}</Text>
          <Text style={styles.meta}>❤️ {item.likesCount || 0}</Text>
        </View>
      </View>
      </Pressable>
    </Animated.View>
  );
}

export default memo(CaseCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 0,
    ...theme.shadow.card,
  },
  mediaWrap: {
    width: "100%",
    height: 148,
    borderTopLeftRadius: theme.radius.md,
    borderTopRightRadius: theme.radius.md,
    overflow: "hidden",
    backgroundColor: "#E2E8F0",
  },
  media: { width: "100%", height: "100%" },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.62)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: "flex-end",
  },
  overlayClass: { color: "#fff", fontSize: 22, fontWeight: "700" },
  overlayOrgan: { color: "#D1D5DB", fontSize: 12, fontWeight: "600" },
  thumbStub: {
    width: "100%",
    height: "100%",
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbStubText: { color: theme.colors.primary, fontWeight: "700" },
  body: { gap: 8, padding: theme.spacing.sm },
  description: { fontSize: 13, color: theme.colors.textSecondary },
  metaRow: { flexDirection: "row", gap: 12 },
  meta: { color: theme.colors.textSecondary, fontSize: 12 },
});
