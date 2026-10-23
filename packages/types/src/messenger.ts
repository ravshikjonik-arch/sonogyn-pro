import { z } from "zod";

import { clinicalPlainText } from "./clinical-validation";

export const MessengerChatTypeSchema = z.enum(["channel", "dm", "group", "consilium"]);
export type MessengerChatType = z.infer<typeof MessengerChatTypeSchema>;

export const MessengerMemberRoleSchema = z.enum(["owner", "admin", "member"]);
export type MessengerMemberRole = z.infer<typeof MessengerMemberRoleSchema>;

export const MessengerMessageTypeSchema = z.enum(["text", "system"]);
export type MessengerMessageType = z.infer<typeof MessengerMessageTypeSchema>;

export const MessengerAttachmentMediaTypeSchema = z.enum(["image", "video", "file", "audio"]);
export type MessengerAttachmentMediaType = z.infer<typeof MessengerAttachmentMediaTypeSchema>;

export const MessengerReceiptStatusSchema = z.enum(["delivered", "read"]);
export type MessengerReceiptStatus = z.infer<typeof MessengerReceiptStatusSchema>;

export const MessengerMessageRowSchema = z.object({
  id: z.string().uuid(),
  chat_id: z.string().uuid(),
  seq: z.number().int().nonnegative(),
  client_uuid: z.string().uuid(),
  sender_id: z.string().uuid(),
  message_type: MessengerMessageTypeSchema,
  body: z.string().nullable(),
  reply_to_message_id: z.string().uuid().nullable(),
  edited_at: z.string().datetime().nullable(),
  deleted_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});
export type MessengerMessageRow = z.infer<typeof MessengerMessageRowSchema>;

export const MessengerAttachmentRowSchema = z.object({
  id: z.string().uuid(),
  message_id: z.string().uuid(),
  storage_path: z.string(),
  media_type: MessengerAttachmentMediaTypeSchema,
  byte_size: z.number().int().nullable().optional(),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
  preview_storage_path: z.string().nullable().optional(),
});
export type MessengerAttachmentRow = z.infer<typeof MessengerAttachmentRowSchema>;

/** History: `beforeSeq` — older page. Gap fill: `afterSeq` — newer than seq (asc, no mix with beforeSeq). */
export const MessengerMessagesQuerySchema = z
  .object({
    chatId: z.string().uuid(),
    beforeSeq: z.coerce.number().int().nonnegative().optional(),
    afterSeq: z.coerce.number().int().nonnegative().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .refine((v) => !(v.beforeSeq != null && v.afterSeq != null), {
    message: "Use either beforeSeq or afterSeq, not both",
  });
export type MessengerMessagesQuery = z.infer<typeof MessengerMessagesQuerySchema>;

export const MessengerResolveChannelQuerySchema = z.object({
  legacyChannelId: z.string().uuid(),
});
export type MessengerResolveChannelQuery = z.infer<typeof MessengerResolveChannelQuerySchema>;

export const MessengerSendBodySchema = z
  .object({
    chatId: z.string().uuid(),
    clientUuid: z.string().uuid(),
    body: clinicalPlainText(5000).nullable().optional(),
    replyToMessageId: z.string().uuid().nullable().optional(),
    attachmentStoragePath: z.string().trim().max(1000).nullable().optional(),
    attachmentMediaType: MessengerAttachmentMediaTypeSchema.nullable().optional(),
  })
  .strict()
  .refine(
    (v) =>
      (v.body != null && v.body.trim().length > 0) ||
      (v.attachmentStoragePath != null && v.attachmentStoragePath.length > 0),
    { message: "Сообщение пустое" },
  );
export type MessengerSendBody = z.infer<typeof MessengerSendBodySchema>;

export const MessengerSendResponseSchema = z.object({
  message: MessengerMessageRowSchema,
  attachments: z.array(MessengerAttachmentRowSchema).optional(),
});
export type MessengerSendResponse = z.infer<typeof MessengerSendResponseSchema>;

export const MessengerReportBodySchema = z
  .object({
    chatId: z.string().uuid(),
    messageId: z.string().uuid(),
    reason: z.string().trim().min(3).max(1000),
  })
  .strict();
export type MessengerReportBody = z.infer<typeof MessengerReportBodySchema>;

export const MessengerAiSuggestBodySchema = z
  .object({
    chatId: z.string().uuid(),
    prompt: z.string().trim().min(3).max(2000),
    replyToMessageId: z.string().uuid().optional(),
  })
  .strict();
export type MessengerAiSuggestBody = z.infer<typeof MessengerAiSuggestBodySchema>;

export const MessengerCaseCardQuerySchema = z.object({
  caseId: z.string().uuid(),
});
export type MessengerCaseCardQuery = z.infer<typeof MessengerCaseCardQuerySchema>;
