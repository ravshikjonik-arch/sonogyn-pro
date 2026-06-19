import { handlePaymentCreate } from "@/lib/payment/handlers";

export const runtime = "nodejs";
export const maxDuration = 60;

/** POST /api/payment/create — создание платежа ЮKassa. */
export async function POST(req: Request) {
  return handlePaymentCreate(req);
}
