import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Linking, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import type { RootStackParamList } from "../navigation/AppStack";
import { isIapEnabled, STORE_SUPPORT_MAILTO } from "../config/storeRelease";
import i18n from "../i18n";

type Props = NativeStackScreenProps<RootStackParamList, "Paywall">;

/**
 * Guest pilot: no IAP / fake prices (Guideline 3.1.1).
 * Full RevenueCat UI returns when EXPO_PUBLIC_REVENUECAT_API_KEY_IOS is set and open-access is off.
 */
export default function PaywallScreen({ navigation }: Props) {
  if (!isIapEnabled()) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.card}>
          <Text style={styles.title}>Подписка в этой версии недоступна</Text>
          <Text style={styles.body}>
            Пилот App Store: калькуляторы и обучение открыты без оплаты. Покупки через App Store
            подключим в следующем релизе. Вопросы — на почту поддержки.
          </Text>
          <Pressable
            style={styles.secondary}
            onPress={() => void Linking.openURL(STORE_SUPPORT_MAILTO)}
            accessibilityRole="link"
            accessibilityLabel="Написать в поддержку"
          >
            <Text style={styles.secondaryText}>Написать в поддержку</Text>
          </Pressable>
          <Pressable
            style={styles.primary}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel={i18n.t("back")}
          >
            <Text style={styles.primaryText}>Закрыть</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // IAP path reserved for a later release with RevenueCat + App Store products.
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <Text style={styles.title}>PRO</Text>
        <Text style={styles.body}>Загрузка тарифов… Если экран не обновится — закройте и откройте снова.</Text>
        <Pressable style={styles.primary} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryText}>{i18n.t("back")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f172a", justifyContent: "center", padding: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  body: { fontSize: 14, lineHeight: 20, color: "#475569" },
  primary: {
    marginTop: 8,
    backgroundColor: "#0f766e",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "700" },
  secondary: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryText: { color: "#334155", fontWeight: "600" },
});
