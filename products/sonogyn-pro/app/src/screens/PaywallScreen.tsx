import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { PurchasesPackage } from "react-native-purchases";
import type { RootStackParamList } from "../navigation/AppStack";
import { getOfferings, isProUser, purchasePackage, restorePurchases } from "../services/purchaseService";
import { useProAccess } from "../hooks/useProAccess";
import i18n from "../i18n";

type Props = NativeStackScreenProps<RootStackParamList, "Paywall">;

type FeatureCardProps = {
  icon: string;
  title: string;
  description: string;
  delay: number;
};

function FeatureCard({ icon, title, description, delay }: FeatureCardProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 320,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, slide]);

  return (
    <Animated.View
      style={[
        styles.featureCard,
        {
          opacity,
          transform: [{ translateY: slide }],
        },
      ]}
    >
      <View style={styles.featureIconWrap}>
        <Text style={styles.featureIcon}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{description}</Text>
      </View>
    </Animated.View>
  );
}

export default function PaywallScreen({ navigation }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;
  const { isPro, refresh } = useProAccess();
  const isWeb = Platform.OS === "web";
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.02,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    async function loadOfferings() {
      if (isWeb) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const current = await getOfferings();
        const available = current?.availablePackages ?? [];
        setPackages(available);
        const preferred =
          available.find((p) => p.packageType === "ANNUAL") ??
          available.find((p) => p.packageType === "MONTHLY") ??
          available[0];
        setSelectedId(preferred?.identifier ?? "");
      } catch (e) {
        setError(e instanceof Error ? e.message : i18n.t("load_error"));
      } finally {
        setLoading(false);
      }
    }
    void loadOfferings();
  }, [isWeb]);

  const prices = useMemo(() => {
    if (packages.length === 0) {
      return [
        { id: "month", title: "€7 / month", subtitle: i18n.t("flexible_access") },
        { id: "year", title: i18n.t("yearly_short_price"), subtitle: i18n.t("better_for_daily"), badge: i18n.t("best_choice") },
      ];
    }
    return packages.map((pkg) => ({
      id: pkg.identifier,
      title: pkg.product.priceString,
      subtitle:
        pkg.packageType === "ANNUAL"
          ? i18n.t("yearly_access")
          : pkg.packageType === "MONTHLY"
            ? i18n.t("monthly_access")
            : i18n.t("pro_access"),
      badge: pkg.packageType === "ANNUAL" ? i18n.t("best_choice") : undefined,
    }));
  }, [packages]);

  async function onPurchase() {
    if (isWeb) {
      Alert.alert("Web access", "Подписка через RevenueCat доступна в iOS/Android сборках. Для web используйте корпоративный доступ или preview build.");
      return;
    }
    const pkg = packages.find((p) => p.identifier === selectedId) ?? packages[0];
    if (!pkg) {
      Alert.alert(i18n.t("plan_unavailable"), i18n.t("retry_later"));
      return;
    }
    try {
      setPurchasing(true);
      setError(null);
      await purchasePackage(pkg);
      const pro = await isProUser();
      if (pro) {
        await refresh();
        Alert.alert(i18n.t("purchase_success_title"), i18n.t("purchase_success_text"));
        navigation.goBack();
      } else {
        Alert.alert(i18n.t("status_check_title"), i18n.t("status_check_pending"));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : i18n.t("purchase_error_title"));
      Alert.alert(i18n.t("purchase_error_title"), i18n.t("check_connection_retry"));
    } finally {
      setPurchasing(false);
    }
  }

  async function onRestore() {
    if (isWeb) {
      Alert.alert("Web access", "Восстановление покупок доступно в iOS/Android приложении.");
      return;
    }
    try {
      setRestoring(true);
      setError(null);
      await restorePurchases();
      const pro = await isProUser();
      await refresh();
      if (pro) {
        Alert.alert(i18n.t("restore_done"), i18n.t("restore_success"));
        navigation.goBack();
      } else {
        Alert.alert(i18n.t("restore_not_found_title"), i18n.t("restore_not_found_text"));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : i18n.t("restore_error"));
      Alert.alert(i18n.t("error"), i18n.t("restore_error"));
    } finally {
      setRestoring(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>{i18n.t("back")}</Text>
          </Pressable>
        </View>
        {error ? (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>{i18n.t("offline_banner")}</Text>
          </View>
        ) : null}
        {isWeb ? (
          <View style={styles.webBanner}>
            <Text style={styles.webBannerTitle}>Web/PWA режим</Text>
            <Text style={styles.webBannerText}>
              Платёжный SDK RevenueCat работает в mobile build. Для web production подключается backend billing
              или B2B доступ для клиник.
            </Text>
          </View>
        ) : null}

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{i18n.t("paywall_title")}</Text>
          <Text style={styles.heroSubtitle}>
            {i18n.t("paywall_subtitle")}
          </Text>
          {isPro ? <Text style={styles.proActiveText}>{i18n.t("paywall_active")}</Text> : null}
        </View>

        <View style={styles.section}>
          <FeatureCard
            icon="✔"
            title={i18n.t("feature_ai_title")}
            description={i18n.t("feature_ai_desc")}
            delay={0}
          />
          <FeatureCard
            icon="✔"
            title={i18n.t("feature_fast_title")}
            description={i18n.t("feature_fast_desc")}
            delay={60}
          />
          <FeatureCard
            icon="✔"
            title={i18n.t("feature_history_title")}
            description={i18n.t("feature_history_desc")}
            delay={120}
          />
          <FeatureCard
            icon="✔"
            title={i18n.t("feature_priority_title")}
            description={i18n.t("feature_priority_desc")}
            delay={180}
          />
        </View>

        <View style={styles.socialProof}>
          <Text style={styles.socialProofText}>
            Используется врачами УЗИ для ежедневной практики
          </Text>
        </View>

        <View style={styles.limitBox}>
          <Text style={styles.limitText}>{i18n.t("used_free_analyses")}</Text>
        </View>

        <View style={styles.section}>
          {loading ? <ActivityIndicator color="#0f766e" /> : null}
          {prices.map((plan) => (
            <Pressable
              key={plan.id}
              style={[
                styles.priceCard,
                (plan.badge || selectedId === plan.id) && styles.priceCardPrimary,
                selectedId === plan.id && styles.priceCardSelected,
              ]}
              onPress={() => setSelectedId(plan.id)}
            >
              <View style={styles.priceRow}>
                <Text style={styles.priceTitle}>{plan.title}</Text>
                {plan.badge ? <Text style={styles.priceBadge}>{plan.badge}</Text> : null}
              </View>
              <Text style={styles.priceSubtitle}>{plan.subtitle}</Text>
            </Pressable>
          ))}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <Animated.View style={{ transform: [{ scale: pulse }] }}>
          <Pressable
            style={[styles.primaryBtn, purchasing && { opacity: 0.8 }]}
            onPress={onPurchase}
            disabled={purchasing || loading}
          >
            {purchasing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryBtnText}>{i18n.t("get_access")}</Text>
            )}
          </Pressable>
        </Animated.View>

        <Pressable style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.secondaryBtnText}>{i18n.t("continue_free")}</Text>
        </Pressable>

        <Pressable
          style={[styles.restoreBtn, restoring && { opacity: 0.7 }]}
          onPress={onRestore}
          disabled={restoring}
        >
          {restoring ? (
            <ActivityIndicator size="small" color="#475569" />
          ) : (
            <Text style={styles.restoreBtnText}>{i18n.t("restore_purchases")}</Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 28, gap: 14 },
  headerRow: { flexDirection: "row", justifyContent: "flex-start" },
  offlineBanner: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fff5f5",
    padding: 10,
  },
  offlineText: { color: "#b91c1c", fontSize: 12, fontWeight: "600" },
  webBanner: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
    padding: 12,
    gap: 4,
  },
  webBannerTitle: { color: "#1d4ed8", fontSize: 14, fontWeight: "800" },
  webBannerText: { color: "#334155", fontSize: 12, lineHeight: 18 },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dbe2ea",
    backgroundColor: "#fff",
  },
  backBtnText: { color: "#0f172a", fontWeight: "600" },
  hero: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f5d487",
    padding: 16,
    gap: 6,
  },
  heroTitle: { fontSize: 24, fontWeight: "800", color: "#0f172a" },
  heroSubtitle: { fontSize: 14, color: "#475569", lineHeight: 20 },
  proActiveText: { marginTop: 6, color: "#0f766e", fontWeight: "700", fontSize: 12 },
  section: { gap: 10 },
  featureCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  featureIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#f5d487",
    alignItems: "center",
    justifyContent: "center",
  },
  featureIcon: { color: "#a16207", fontWeight: "800" },
  featureTitle: { fontSize: 15, fontWeight: "700", color: "#0f172a" },
  featureDesc: { marginTop: 2, color: "#475569", fontSize: 13 },
  socialProof: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
  },
  socialProofText: { color: "#334155", fontSize: 13 },
  limitBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#fde68a",
    backgroundColor: "#fffbeb",
    padding: 12,
  },
  limitText: { color: "#92400e", fontWeight: "600" },
  priceCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 12,
    gap: 4,
  },
  priceCardPrimary: { borderColor: "#f5d487", backgroundColor: "#fffbeb" },
  priceCardSelected: { borderColor: "#a16207", borderWidth: 1.5 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priceTitle: { fontSize: 19, fontWeight: "800", color: "#0f172a" },
  priceSubtitle: { color: "#475569", fontSize: 13 },
  errorText: { color: "#b91c1c", fontSize: 12 },
  priceBadge: {
    fontSize: 11,
    color: "#a16207",
    fontWeight: "700",
    backgroundColor: "#fff3c4",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: "hidden",
  },
  primaryBtn: {
    borderRadius: 14,
    backgroundColor: "#0f766e",
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: "#0f766e",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: { color: "#ffffff", fontWeight: "800", fontSize: 16 },
  secondaryBtn: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dbe2ea",
    backgroundColor: "#ffffff",
    paddingVertical: 13,
    alignItems: "center",
  },
  secondaryBtnText: { color: "#475569", fontWeight: "600", fontSize: 14 },
  restoreBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  restoreBtnText: {
    color: "#64748b",
    fontSize: 13,
    textDecorationLine: "underline",
  },
});
