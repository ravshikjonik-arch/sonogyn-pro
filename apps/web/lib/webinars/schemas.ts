import { z } from "zod";

export const WebinarChatPostSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export const WebinarLifecycleSchema = z.object({
  action: z.enum(["start", "end"]),
});

export const WebinarChatModerateSchema = z.object({
  messageId: z.string().uuid(),
  isHidden: z.boolean().optional(),
  isPinned: z.boolean().optional(),
});
