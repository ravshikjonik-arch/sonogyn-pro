import { z } from "zod";

export const WebPushSubscriptionBodySchema = z
  .object({
    endpoint: z.string().url().max(2000),
    keys: z.object({
      p256dh: z.string().min(1).max(500),
      auth: z.string().min(1).max(500),
    }),
  })
  .strict();

export type WebPushSubscriptionBody = z.infer<typeof WebPushSubscriptionBodySchema>;
