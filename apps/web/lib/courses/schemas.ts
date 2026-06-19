import { z } from "zod";

export const CourseUpsertSchema = z.object({
  title: z.string().trim().min(1, "Укажите название").max(200),
  description_html: z.string().max(200_000).optional().default(""),
  status: z.enum(["draft", "published", "archived"]).optional(),
  price_rub: z.number().int().min(0).max(1_000_000).optional(),
});

export const ModuleUpsertSchema = z.object({
  title: z.string().trim().min(1).max(200),
});

export const ModuleReorderSchema = z.object({
  moduleIds: z.array(z.string().uuid()).min(1),
});

export const LessonUpsertSchema = z.object({
  module_id: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  body_html: z.string().max(200_000).optional().default(""),
  lesson_type: z.enum(["video", "offline"]),
  video_url: z
    .union([z.string().url().max(2000), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  offline_starts_at: z.string().datetime().optional().nullable(),
  offline_address: z.string().max(500).optional().nullable(),
  offline_stream_url: z
    .union([z.string().url().max(2000), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  max_seats: z.number().int().min(1).max(10_000).optional().nullable(),
  duration_minutes: z.number().int().min(1).max(24 * 60).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  is_free_preview: z.boolean().optional(),
});

export const LessonReorderSchema = z.object({
  module_id: z.string().uuid(),
  lessonIds: z.array(z.string().uuid()).min(1),
});

export const NotifyStudentsSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(4000),
  channels: z.object({
    email: z.boolean().optional(),
    sms: z.boolean().optional(),
    telegram: z.boolean().optional(),
  }),
});
