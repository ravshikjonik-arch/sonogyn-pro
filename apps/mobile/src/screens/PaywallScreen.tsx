import { useCallback, useEffect, useState } from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import type { RootStackParamList } from "../navigation/AppStack";
import {
  IOS_PRO_MONTHLY_PRODUCT_ID,
  PLATFORM_LAUNCH_DATE_RU,
  STORE_SUPPORT_MAILTO,
  isIapEnabled,
} from "../config/storeRelease";
import {
  getProMonthlyPackage,
  purchasePackage,
  restorePurchases,
} from "../services/purchaseService";
import i18n from "../i18n";

type Props = NativeStackScreenProps<RootStackParamList, "Paywall">;

/**
 * Until 27.12.2026: pilot message (no IAP).
 * After cutover + RevenueCat key: monthly PRO via App Store.
 */
export default function PaywallScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isIapEnabled()) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const monthly = await getProMonthlyPackage();
      setPkg(monthly);
      if (!monthly) {
        setError(
          `Тариф PRO (${IOS_PRO_MONTHLY_PRODUCT_ID}) пока не найден в App Store. Попробуйте позже или напишите в поддержку.`,
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить тарифы.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onPurchase = async () => {
    if (!pkg) return;
    try {
      setBusy(true);
      await purchasePackage(pkg);
      Alert.alert("PRO активен", "Подписка оформлена. Спасибо!");
      navigation.goBack();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Покупка не завершена.";
      if (!/cancel/i.test(message)) {
        Alert.alert("Оплата", message);
      }
    } finally {
      setBusy(false);
    }
  };

  const onRestore = async () => {
    try {
      setBusy(true);
      await restorePurchases();
      Alert.alert("Восстановление", "Покупки обновлены. Если PRO был активен — доступ вернётся.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Восстановление", e instanceof Error ? e.message : "Не удалось восстановить.");
    } finally {
      setBusy(false);
    }
  };

  if (!isIapEnabled()) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.card}>
          <Text style={styles.title}>Подписка PRO</Text>
          <Text style={styles.body}>
            Скачивание бесплатно. До {PLATFORM_LAUNCH_DATE_RU} открыт пилот: калькуляторы и обучение
            без оплаты. С {PLATFORM_LAUNCH_DATE_RU} PRO станет платной подпиской App Store (~500 ₽/мес
            на web; цена iOS — в карточке App Store).
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.card}>
        <Text style={styles.title}>SonoGyn PRO</Text>
        <Text style={styles.body}>
          Подписка снимает лимиты AI и кейсов. Автопродление можно отменить в настройках Apple ID.
          Установка приложения остаётся бесплатной.
        </Text>

        {loading ? (
          <ActivityIndicator accessibilityLabel="Загрузка тарифов" />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : pkg ? (
          <Text style={styles.price}>
            {pkg.product.priceString}
            <Text style={styles.period}> / месяц</Text>
          </Text>
        ) : null}

        <Pressable
          style={[styles.primary, (!pkg || busy) && styles.disabled]}
          disabled={!pkg || busy}
          onPress={() => void onPurchase()}
          accessibilityRole="button"
          accessibilityLabel="Оформить PRO"
        >
          <Text style={styles.primaryText}>{busy ? "…" : "Оформить PRO"}</Text>
        </Pressable>

        <Pressable
          style={styles.secondary}
          disabled={busy}
          onPress={() => void onRestore()}
          accessibilityRole="button"
          accessibilityLabel="Восстановить покупки"
        >
          <Text style={styles.secondaryText}>Восстановить покупки</Text>
        </Pressable>

        <Pressable
          style={styles.secondary}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel={i18n.t("back")}
        >
          <Text style={styles.secondaryText}>{i18n.t("back")}</Text>
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
  price: { fontSize: 28, fontWeight: "800", color: "#0f766e" },
  period: { fontSize: 14, fontWeight: "600", color: "#64748b" },
  error: { fontSize: 13, lineHeight: 18, color: "#b91c1c" },
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
  disabled: { opacity: 0.5 },
});
