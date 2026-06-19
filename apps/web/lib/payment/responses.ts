import { NextResponse } from "next/server";

export function paymentJson(body: Record<string, unknown>, status = 200): NextResponse {
  return NextResponse.json(body, { status });
}

export function paymentError(message: string, status: number): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export const PAYMENT_MESSAGES = {
  notConfigured: "Оплата не настроена: задайте YOOKASSA_SHOP_ID и YOOKASSA_SECRET_KEY.",
  unauthorized: "Требуется вход в аккаунт.",
  invalidInput: "Некорректные данные запроса.",
  tooManyRequests: "Слишком много запросов. Подождите и повторите.",
  createFailed: "Не удалось создать платёж. Попробуйте позже.",
  recordFailed: "Платёж создан, но не сохранён в базе. Обратитесь в поддержку.",
  webhookForbidden: "Webhook отклонён: недопустимый источник.",
  webhookInvalid: "Некорректное тело webhook.",
  webhookFailed: "Ошибка обработки webhook.",
} as const;
