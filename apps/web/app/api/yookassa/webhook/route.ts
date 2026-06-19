import { handlePaymentWebhook } from "@/lib/payment/handlers";

export const runtime = "nodejs";
export const maxDuration = 60;

/** @deprecated Используйте POST /api/payment/webhook */
export async function POST(req: Request) {
  const rawBody = await req.text();
  return handlePaymentWebhook(req, rawBody);
}
