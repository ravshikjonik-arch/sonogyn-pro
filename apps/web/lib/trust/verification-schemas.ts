import { z } from "zod";

import { DOCTOR_VERIFICATION_SPECIALIZATIONS } from "@/lib/trust/verification-constants";

export const DoctorVerificationSubmitFieldsSchema = z.object({
  full_name: z.string().trim().min(2, "Укажите ФИО").max(200),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Дата рождения: формат ГГГГ-ММ-ДД")
    .optional()
    .or(z.literal("")),
  specialization: z.enum(DOCTOR_VERIFICATION_SPECIALIZATIONS),
  diploma_number: z.string().trim().max(120).optional().or(z.literal("")),
  org_name: z.string().trim().max(300).optional().or(z.literal("")),
});

export const AdminReviewVerificationSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
  rejection_reason: z.string().trim().max(2000).optional(),
});

export type DoctorVerificationRow = {
  id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected" | "expired";
  full_name: string;
  birth_date: string | null;
  specialization: string;
  diploma_number: string | null;
  diploma_file_path: string | null;
  org_name: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  rejection_reason: string | null;
};
