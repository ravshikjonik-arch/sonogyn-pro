import { z } from "zod";

/** Как показывать врача в чате коллег: сокращённое ФИО или выбранный ник. */
export const ChatNameModeSchema = z.enum(["fio", "nick"]);
export type ChatNameMode = z.infer<typeof ChatNameModeSchema>;

/**
 * Ник в чате: 2–32 символа, буквы (в т.ч. кириллица), цифры, _ . -
 * Без пробелов и @ (чтобы не маскировать email).
 */
export const ChatNicknameSchema = z
  .string()
  .trim()
  .min(2, "Ник — минимум 2 символа.")
  .max(32, "Ник — максимум 32 символа.")
  .regex(
    /^[\p{L}\p{N}_.-]+$/u,
    "Ник: только буквы, цифры, _ . - (без пробелов и @).",
  );

export type ChatNickname = z.infer<typeof ChatNicknameSchema>;

export const ChatDisplayChoiceSchema = z
  .object({
    chat_name_mode: ChatNameModeSchema.default("fio"),
    chat_nickname: z.string().trim().max(32).optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.chat_name_mode === "nick") {
      const nick = (val.chat_nickname ?? "").trim();
      const parsed = ChatNicknameSchema.safeParse(nick);
      if (!parsed.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: parsed.error.issues[0]?.message ?? "Укажите корректный ник.",
          path: ["chat_nickname"],
        });
      }
    }
  });

export type ChatDisplayChoice = z.infer<typeof ChatDisplayChoiceSchema>;
