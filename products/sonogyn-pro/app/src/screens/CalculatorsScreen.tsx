import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MiniUltrasoundPreview,
  OrganMedicalIllustration,
  type OrganIllustrationVariant,
} from "../components/calculators/OrganMedicalIllustration";
import type { MainTabParamList, RootStackParamList } from "../navigation/paramLists";
import { theme } from "../theme";

export type CalculatorsTabScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "CalculatorsTab">,
  NativeStackScreenProps<RootStackParamList>
>;

const SCREEN_BG = "#F7F9FB";
const PAD = 16;
const GAP = 18;
const CARD_RADIUS = 24;
const ART_HEIGHT = 112;
const INK = "#0F2744";
const MUTED = "#5C6B7A";

type Tile = {
  id: string;
  title: string;
  subtitle: string;
  art: OrganIllustrationVariant;
  onPress: () => void;
};

function PremiumCalculatorCard({
  width,
  title,
  subtitle,
  art,
  onPress,
}: {
  width: number;
  title: string;
  subtitle: string;
  art: OrganIllustrationVariant;
  onPress: () => void;
}) {
  return (
    <View style={[styles.cardShadow, { width }]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.cardInner, pressed && styles.cardPressed]}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${subtitle}`}
      >
        <View style={styles.artZone}>
          <OrganMedicalIllustration variant={art} width={width} height={ART_HEIGHT} />
          <View style={styles.usBadge}>
            <MiniUltrasoundPreview size={44} />
          </View>
        </View>
        <View style={styles.textBlock}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

export default function CalculatorsScreen({ navigation }: CalculatorsTabScreenProps) {
  const { width: winW } = useWindowDimensions();
  const colW = useMemo(() => Math.floor((winW - PAD * 2 - GAP) / 2), [winW]);

  const tiles: Tile[] = useMemo(
    () => [
      {
        id: "ov",
        title: "Яичник",
        subtitle: "O-RADS + IOTA 2026",
        art: "ovary",
        onPress: () => navigation.navigate("ORADSPro"),
      },
      {
        id: "ut",
        title: "Матка",
        subtitle: "FIGO · аденомиоз · ДИЭ",
        art: "uterus",
        onPress: () => navigation.navigate("GynecologyCalc", { initialPage: "gyn_uterus_clinic" }),
      },
      {
        id: "br",
        title: "Молочная железа",
        subtitle: "BI-RADS US",
        art: "breast",
        onPress: () => navigation.navigate("BiRadsAssistant"),
      },
      {
        id: "thy",
        title: "Щитовидка",
        subtitle: "TI-RADS US · ACR 2017",
        art: "thyroid",
        onPress: () => navigation.navigate("TiRadsAssistant"),
      },
      {
        id: "ln",
        title: "Лимфоузел",
        subtitle: "LN-RADS",
        art: "lymph",
        onPress: () => navigation.navigate("GynecologyCalc", { initialPage: "gyn_lnrads" }),
      },
      {
        id: "pn",
        title: "УЗИ плода",
        subtitle: "FMF · скрининг",
        art: "prenatal",
        onPress: () => navigation.navigate("FMFAssistant"),
      },
      {
        id: "pr",
        title: "Пролапс таза",
        subtitle: "POP-Q",
        art: "prolapse",
        onPress: () => navigation.navigate("Prolapse"),
      },
    ],
    [navigation]
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Клинические инструменты</Text>
        <Text style={styles.title}>Калькуляторы</Text>
        <Text style={styles.sub}>Шкалы и протоколы по нозологиям</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {tiles.map((t) => (
            <PremiumCalculatorCard
              key={t.id}
              width={colW}
              title={t.title}
              subtitle={t.subtitle}
              art={t.art}
              onPress={t.onPress}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const shadow =
  Platform.OS === "ios"
    ? {
        shadowColor: "#0F2744",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 20,
      }
    : { elevation: 4 };

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: SCREEN_BG },
  header: {
    paddingHorizontal: PAD,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E8EDF2",
    backgroundColor: SCREEN_BG,
  },
  kicker: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7C8F",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  title: { fontSize: 28, fontWeight: "800", color: INK, marginTop: 6, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: MUTED, marginTop: 6, lineHeight: 20, fontWeight: "500" },
  scroll: { paddingHorizontal: PAD, paddingTop: GAP, paddingBottom: 36 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  cardShadow: {
    marginBottom: 0,
    borderRadius: CARD_RADIUS,
    backgroundColor: "#ffffff",
    ...shadow,
  },
  cardInner: {
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(15, 39, 68, 0.06)",
  },
  cardPressed: { opacity: 0.94, transform: [{ scale: 0.988 }] },
  artZone: {
    height: ART_HEIGHT,
    position: "relative",
    backgroundColor: "#fff",
  },
  usBadge: {
    position: "absolute",
    right: 10,
    bottom: 8,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.95)",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      default: { elevation: 3 },
    }),
  },
  textBlock: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: 4,
    paddingBottom: 16,
    gap: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: INK,
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: "600",
    color: MUTED,
    lineHeight: 18,
  },
});
