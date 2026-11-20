import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { IOS_PRO_MONTHLY_PRODUCT_ID } from "../config/storeRelease";
import { pickProMonthlyPackage } from "./pickProMonthlyPackage";

describe("pickProMonthlyPackage", () => {
  it("prefers sonogyn_pro_monthly product id", () => {
    const picked = pickProMonthlyPackage({
      availablePackages: [
        {
          identifier: "$rc_annual",
          packageType: "ANNUAL",
          product: { identifier: "other_annual" },
        },
        {
          identifier: "$rc_monthly",
          packageType: "MONTHLY",
          product: { identifier: IOS_PRO_MONTHLY_PRODUCT_ID },
        },
      ],
    });
    assert.equal(picked?.product.identifier, IOS_PRO_MONTHLY_PRODUCT_ID);
  });

  it("falls back to MONTHLY package type", () => {
    const picked = pickProMonthlyPackage({
      availablePackages: [
        { identifier: "week", packageType: "WEEKLY", product: { identifier: "w" } },
        { identifier: "month", packageType: "MONTHLY", product: { identifier: "legacy_month" } },
      ],
    });
    assert.equal(picked?.product.identifier, "legacy_month");
  });

  it("returns null when empty", () => {
    assert.equal(pickProMonthlyPackage(null), null);
    assert.equal(pickProMonthlyPackage({ availablePackages: [] }), null);
  });
});
