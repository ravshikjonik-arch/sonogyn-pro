import { handlePaymentCreate } from "@/lib/payment/handlers";

export const runtime = "nodejs";
export const maxDuration = 60;

/** @deprecated Используйте POST /api/payment/create */
export async function POST(req: Request) {
  return handlePaymentCreate(req);
}
