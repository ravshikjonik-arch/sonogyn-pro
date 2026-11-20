import { IOS_PRO_MONTHLY_PRODUCT_ID } from "../config/storeRelease";

/** Minimal shape used to pick the monthly PRO StoreKit / RevenueCat package. */
export type ProPackageLike = {
  identifier: string;
  packageType?: string;
  product: { identifier: string };
};

export type ProOfferingLike = {
  availablePackages: ProPackageLike[];
};

/** Prefer App Store product `sonogyn_pro_monthly`, then MONTHLY package. */
export function pickProMonthlyPackage(
  offering: ProOfferingLike | null | undefined,
): ProPackageLike | null {
  const packages = offering?.availablePackages ?? [];
  if (packages.length === 0) return null;
  return (
    packages.find((p) => p.product.identifier === IOS_PRO_MONTHLY_PRODUCT_ID) ??
    packages.find((p) => p.packageType === "MONTHLY") ??
    packages.find((p) => p.identifier.toLowerCase().includes("month")) ??
    packages[0] ??
    null
  );
}
