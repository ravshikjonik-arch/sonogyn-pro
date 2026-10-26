import type { ReactNode } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { branding } from "../config/branding";
import { useAppGate } from "../navigation/AppGateContext";
import { resetAfterOnboarding } from "../navigation/resetToMain";
import type { RootStackParamList } from "../navigation/paramLists";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

const NAVY = "#07041a";

export function SplashLoadingView() {
  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right", "bottom"]}>
      <SplashCard>
        <Image source={require("../../assets/icon.png")} style={styles.logoImage} accessibilityLabel="SonoGyn Pro" />
        <Text style={styles.appLine1}>{branding.appName}</Text>
        <Text style={styles.appLine2}>Clinical tools</Text>
        <ActivityIndicator size="large" color="#fff" style={styles.loader} />
        <Text style={styles.loadingHint}>Инициализация… Если экран долго не меняется, проверьте сеть и консоль браузера.</Text>
      </SplashCard>
    </SafeAreaView>
  );
}

export default function SplashScreen({ navigation }: Props) {
  const { consentOk, supabaseSession } = useAppGate();

  function onContinue() {
    if (!consentOk) {
      navigation.replace("Consent");
      return;
    }
    resetAfterOnboarding(navigation, supabaseSession);
  }

  return (
    <SafeAreaView style={styles.root} edges={["top", "left", "right", "bottom"]}>
      <Pressable style={styles.pressWrap} onPress={onContinue} accessibilityRole="button" accessibilityLabel="Продолжить">
        <SplashCard>
          <Image source={require("../../assets/icon.png")} style={styles.logoImage} accessibilityLabel="SonoGyn Pro" />
          <Text style={styles.appLine1}>{branding.appName}</Text>
          <Text style={styles.appLine2}>Clinical tools</Text>
          <Text style={styles.appLine3}>УЗИ · шкалы · кейсы</Text>
          <Text style={styles.tapHint}>Нажмите — далее регистрация или вход</Text>
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
    backgroundColor: NAVY,
    borderRadius: 28,
    paddingVertical: 40,
    paddingHorizontal: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 12,
  },
  logoImage: {
    width: 148,
    height: 148,
    borderRadius: 28,
    marginBottom: 22,
  },
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
