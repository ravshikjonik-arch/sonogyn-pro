import { Platform } from "react-native";
import type { PurchasesOffering, PurchasesPackage } from "react-native-purchases";

let initialized = false;
export const ENTITLEMENTS = {
  pro: "pro",
  ai: "ai",
  advancedReports: "advanced_reports",
} as const;

function getApiKey(): string {
  const iosKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS;
  const androidKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID;
  return Platform.OS === "ios" ? iosKey || "" : androidKey || "";
}

async function getPurchasesModule() {
  if (Platform.OS === "web") {
    throw new Error("Subscriptions are available in the iOS/Android app builds.");
  }
  return import("react-native-purchases");
}

export async function initPurchases() {
  if (initialized) return;
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("RevenueCat API key is missing. Set EXPO_PUBLIC_REVENUECAT_API_KEY_IOS/ANDROID.");
  }
  const { default: Purchases, LOG_LEVEL } = await getPurchasesModule();
  Purchases.setLogLevel(LOG_LEVEL.INFO);
  Purchases.configure({ apiKey });
  initialized = true;
}

export async function getOfferings(): Promise<PurchasesOffering | null> {
  await initPurchases();
  const { default: Purchases } = await getPurchasesModule();
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? null;
}

export async function purchasePackage(pkg: PurchasesPackage) {
  await initPurchases();
  const { default: Purchases } = await getPurchasesModule();
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (error) {
    throw error;
  }
}

export async function restorePurchases() {
  await initPurchases();
  const { default: Purchases } = await getPurchasesModule();
  return Purchases.restorePurchases();
}

export async function isProUser() {
  return hasEntitlement(ENTITLEMENTS.pro);
}

export async function hasEntitlement(entitlementId: string) {
  await initPurchases();
  const { default: Purchases } = await getPurchasesModule();
  const info = await Purchases.getCustomerInfo();
  return !!info.entitlements.active[entitlementId];
}
