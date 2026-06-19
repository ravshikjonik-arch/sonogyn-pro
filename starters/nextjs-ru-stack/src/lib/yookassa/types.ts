export type YooKassaPaymentStatus =
  | "pending"
  | "waiting_for_capture"
  | "succeeded"
  | "canceled";

export type YooKassaPaymentResponse = {
  id: string;
  status: YooKassaPaymentStatus;
  amount: { value: string; currency: string };
  confirmation?: { type: string; confirmation_url?: string };
  metadata?: Record<string, string>;
};

export type YooKassaWebhookEvent = {
  type: string;
  event: string;
  object: YooKassaPaymentResponse;
};
