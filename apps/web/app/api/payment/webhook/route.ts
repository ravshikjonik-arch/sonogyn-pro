import { handlePaymentWebhook } from "@/lib/payment/handlers";

export const runtime = "nodejs";
export const maxDuration = 60;

/** POST /api/payment/webhook — входящие уведомления ЮKassa (raw body). */
export async function POST(req: Request) {
  const rawBody = await req.text();
  return handlePaymentWebhook(req, rawBody);
}
