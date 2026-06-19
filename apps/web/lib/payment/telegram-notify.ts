import { TelegramService } from "@/services/telegram";

/** @deprecated Используйте TelegramService.notifyAdminsSafe('payment.succeeded', ...) */
export async function notifyPaymentSucceededTelegram(params: {
  userId: string;
  yookassaId: string;
  amountRub: number;
  description?: string | null;
}): Promise<void> {
  await TelegramService.notifyAdmins("payment.succeeded", {
    userId: params.userId,
    yookassaId: params.yookassaId,
    amountRub: params.amountRub,
    description: params.description ?? undefined,
  });
}
