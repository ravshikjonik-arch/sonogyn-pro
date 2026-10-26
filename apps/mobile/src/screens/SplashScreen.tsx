import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppGate } from "../navigation/AppGateContext";
import { resetAfterOnboarding } from "../navigation/resetToMain";
import type { RootStackParamList } from "../navigation/paramLists";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

const NAVY = "#07041a";
const POSTER = require("../../assets/icon.png");

export function SplashLoadingView() {
  return (
    <View style={styles.root}>
      <Image source={POSTER} style={styles.poster} resizeMode="contain" accessibilityLabel="SonoGyn Pro" />
      <ActivityIndicator color="#ffffff" style={styles.loader} />
    </View>
  );
}

export default function SplashScreen({ navigation }: Props) {
  const { consentOk, supabaseSession } = useAppGate();

  function onStart() {
    if (!consentOk) {
      navigation.replace("Consent");
      return;
    }
    resetAfterOnboarding(navigation, supabaseSession);
  }

  return (
    <View style={styles.root}>
      <Image source={POSTER} style={styles.poster} resizeMode="contain" accessibilityLabel="SonoGyn Pro" />
      <SafeAreaView edges={["bottom"]} style={styles.footer}>
        <Pressable style={styles.start} onPress={onStart} accessibilityRole="button">
          <Text style={styles.startText}>Начать</Text>
        </Pressable>
        {!consentOk ? (
          <Text style={styles.note}>Дальше нужно принять пользовательское соглашение.</Text>
        ) : null}
        <View style={styles.legalRow}>
          <Pressable onPress={() => navigation.navigate("TermsOfUse")}>
            <Text style={styles.legal}>Пользовательское соглашение</Text>
          </Pressable>
          <Text style={styles.dot}>·</Text>
          <Pressable onPress={() => navigation.navigate("PrivacyPolicy")}>
            <Text style={styles.legal}>Конфиденциальность</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: NAVY },
  poster: { flex: 1, width: "100%" },
  loader: { position: "absolute", bottom: 48, alignSelf: "center" },
  footer: { paddingHorizontal: 20, paddingBottom: 12, gap: 10 },
  start: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  startText: { color: NAVY, fontSize: 17, fontWeight: "700" },
  note: { color: "rgba(255,255,255,0.78)", fontSize: 13, textAlign: "center", lineHeight: 18 },
  legalRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  legal: { color: "#c4b5fd", fontSize: 13, fontWeight: "600" },
  dot: { color: "rgba(255,255,255,0.45)" },
});
