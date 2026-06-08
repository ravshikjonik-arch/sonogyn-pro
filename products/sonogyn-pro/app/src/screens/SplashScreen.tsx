import type { ReactNode } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { branding } from "../config/branding";
import { useAppGate } from "../navigation/AppGateContext";
import type { RootStackParamList } from "../navigation/paramLists";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

const PURPLE = "#6D28D9";
const PURPLE_DEEP = "#5B21B6";

export function SplashLoadingView() {
  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right", "bottom"]}>
      <SplashCard>
        <View style={styles.logoTile}>
          <Text style={styles.logoGlyph}>◯</Text>
        </View>
        <Text style={styles.appLine1}>{branding.appName}</Text>
        <Text style={styles.appLine2}>Clinical tools</Text>
        <ActivityIndicator size="large" color="#fff" style={styles.loader} />
        <Text style={styles.loadingHint}>Инициализация… Если экран долго не меняется, проверьте сеть и консоль браузера.</Text>
      </SplashCard>
    </SafeAreaView>
  );
}

export default function SplashScreen({ navigation }: Props) {
  const { consentOk } = useAppGate();

  function onContinue() {
    navigation.replace(consentOk ? "Main" : "Consent");
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right", "bottom"]}>
      <Pressable style={styles.pressWrap} onPress={onContinue} accessibilityRole="button" accessibilityLabel="Продолжить">
        <SplashCard>
          <View style={styles.logoTile}>
            <Text style={styles.logoGlyph}>◯</Text>
          </View>
          <Text style={styles.appLine1}>{branding.appName}</Text>
          <Text style={styles.appLine2}>Clinical tools</Text>
          <Text style={styles.appLine3}>УЗИ · шкалы · кейсы</Text>
          <Text style={styles.tapHint}>Нажмите, чтобы продолжить</Text>
        </SplashCard>
      </Pressable>
    </SafeAreaView>
  );
}

function SplashCard({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  /** Не чисто #fff — чтобы отличать от «пустой» вкладки до монтирования RN */
  root: { flex: 1, backgroundColor: "#e8eef6", justifyContent: "center", padding: 24 },
  pressWrap: { flex: 1, justifyContent: "center" },
  card: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 340,
    backgroundColor: PURPLE,
    borderRadius: 28,
    paddingVertical: 40,
    paddingHorizontal: 28,
    alignItems: "center",
    shadowColor: PURPLE_DEEP,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  logoTile: {
    width: 88,
    height: 88,
    borderRadius: 20,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
  },
  logoGlyph: { fontSize: 40, color: "#c4b5fd", fontWeight: "300" },
  appLine1: { fontSize: 26, fontWeight: "800", color: "#fff", letterSpacing: 0.5 },
  appLine2: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.88)", marginTop: 6 },
  appLine3: { fontSize: 13, fontWeight: "500", color: "rgba(255,255,255,0.72)", marginTop: 10, textAlign: "center" },
  tapHint: {
    marginTop: 28,
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    textDecorationLine: "underline",
    textDecorationColor: "rgba(255,255,255,0.5)",
  },
  loader: { marginTop: 28 },
  loadingHint: {
    marginTop: 16,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.82)",
    textAlign: "center",
    lineHeight: 17,
    maxWidth: 280,
  },
});
