/**
 * Клиент ЮKassa через npm `yookassa-sdk`.
 * Пакет `@yookassa/yookassa-sdk` в npm отсутствует; используем community SDK из раздела
 * «Использование SDK» на yookassa.ru/developers.
 */
import { CurrencyEnum, YooKassa } from "yookassa-sdk";

import { isYooKassaConfigured } from "./config";

type YooKassaSdkInstance = ReturnType<typeof YooKassa>;

let cached: YooKassaSdkInstance | null = null;

export function getYooKassaSdk(): YooKassaSdkInstance {
  if (!isYooKassaConfigured()) {
    throw new Error("YOOKASSA_NOT_CONFIGURED");
  }
  if (cached) return cached;

  cached = YooKassa({
    shop_id: process.env.YOOKASSA_SHOP_ID!.trim(),
    secret_key: process.env.YOOKASSA_SECRET_KEY!.trim(),
    debug: process.env.NODE_ENV !== "production",
  });

  return cached;
}

export type CreatePaymentParams = {
  userId: string;
  amountRub: number;
  description: string;
  returnUrl: string;
};

export async function createPaymentViaSdk(params: CreatePaymentParams) {
  const sdk = getYooKassaSdk();
  return sdk.payments.create({
    amount: {
      value: params.amountRub.toFixed(2),
      currency: CurrencyEnum.RUB,
    },
    capture: true,
    confirmation: {
      type: "redirect",
      return_url: params.returnUrl,
    },
    description: params.description,
    metadata: { userId: params.userId },
  });
}

export async function loadPaymentViaSdk(paymentId: string) {
  const sdk = getYooKassaSdk();
  return sdk.payments.load(paymentId);
}
