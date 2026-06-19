import { randomUUID } from "crypto";

import { fetchWithRetry } from "@/lib/http/fetch-with-retry";

import { isYooKassaConfigured } from "./config";
import type { YooKassaPaymentResponse } from "./types";

function authHeader(): string {
  const shopId = process.env.YOOKASSA_SHOP_ID?.trim() ?? "";
  const secret = process.env.YOOKASSA_SECRET_KEY?.trim() ?? "";
  const token = Buffer.from(`${shopId}:${secret}`).toString("base64");
  return `Basic ${token}`;
}

type CreatePaymentInput = {
  userId: string;
  amountRub: number;
  description: string;
  returnUrl: string;
};

/** Создание платежа в ЮKassa (v3 API). */
export async function createYooKassaPayment(
  input: CreatePaymentInput,
): Promise<YooKassaPaymentResponse> {
  if (!isYooKassaConfigured()) {
    throw new Error("YooKassa is not configured");
  }

  const body = {
    amount: { value: input.amountRub.toFixed(2), currency: "RUB" },
    capture: true,
    confirmation: { type: "redirect", return_url: input.returnUrl },
    description: input.description,
    metadata: { userId: input.userId },
  };

  const res = await fetchWithRetry("https://api.yookassa.ru/v3/payments", {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      "Idempotence-Key": randomUUID(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`YooKassa create failed: ${res.status} ${errText}`);
  }

  return (await res.json()) as YooKassaPaymentResponse;
}

/** Получение статуса платежа (верификация webhook). */
export async function fetchYooKassaPayment(paymentId: string): Promise<YooKassaPaymentResponse> {
  const res = await fetchWithRetry(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
    headers: { Authorization: authHeader() },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`YooKassa fetch failed: ${res.status}`);
  }

  return (await res.json()) as YooKassaPaymentResponse;
}
