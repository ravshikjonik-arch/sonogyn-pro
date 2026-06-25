import { handlePaymentWebhook } from "@/lib/payment/handlers";
import { paymentError } from "@/lib/payment/responses";

export const runtime = "nodejs";
export const maxDuration = 60;

/** POST /api/payment/webhook — входящие уведомления ЮKassa (raw body). */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    return handlePaymentWebhook(req, rawBody);
  } catch {
    return paymentError("Некорректное тело webhook.", 400);
  }
}
