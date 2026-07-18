import { z } from "zod";

const PHI_PATTERNS = [
  /\b(?:\+?7|8)[\s(-]*\d{3}[\s)-]*\d{3}[\s-]*\d{2}[\s-]*\d{2}\b/,
  /\b\d{2}[./-]\d{2}[./-]\d{2,4}\b/,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b[А-ЯЁ][а-яё]+(?:\s+[А-ЯЁ][а-яё]+){1,2}\b/,
];

function hasPotentialPhi(value: string): boolean {
  return PHI_PATTERNS.some((pattern) => pattern.test(value));
}

export const NoPhiTextSchema = z
  .string()
  .max(500)
  .refine((value) => !hasPotentialPhi(value), {
    message: "Не вводите ФИО, телефон, email или дату рождения пациентки",
  });

export const CytologyBethesdaCodeSchema = z.enum([
  "nilm",
  "asc-us",
  "asc-h",
  "lsil",
  "hsil",
  "agc",
  "ais",
  "carcinoma",
  "unsatisfactory",
]);

export const CytologyHpvStatusSchema = z.enum([
  "negative",
  "positive",
  "16-positive",
  "18-positive",
  "unknown",
]);

export const CytologyScreeningInputSchema = z.object({
  age: z.number().int().min(14).max(90),
  sexuallyActive: z.boolean().optional(),
  sexualDebutAge: z.number().int().min(8).max(80).nullable().optional(),
  pregnant: z.boolean().optional(),
  immunodeficient: z.boolean().optional(),
  hivPositive: z.boolean().optional(),
  postmenopausal: z.boolean().optional(),
  lastPapMonthsAgo: z.number().int().min(0).max(600).nullable().optional(),
  lastHpvMonthsAgo: z.number().int().min(0).max(600).nullable().optional(),
  cytology: CytologyBethesdaCodeSchema.nullable().optional(),
  hpvStatus: CytologyHpvStatusSchema.optional(),
  hpv16Positive: z.boolean().optional(),
  hpv18Positive: z.boolean().optional(),
  priorExcision: z.boolean().optional(),
}).superRefine((value, ctx) => {
  if (value.sexualDebutAge != null && value.sexualDebutAge > value.age) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["sexualDebutAge"],
      message: "Возраст начала половой жизни не может быть больше текущего возраста",
    });
  }
  if ((value.hpv16Positive || value.hpv18Positive) && value.hpvStatus === "negative") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["hpvStatus"],
      message: "HPV16/18+ несовместим с отрицательным HPV",
    });
  }
});

export const BethesdaAssistInputSchema = z.object({
  age: z.number().int().min(14).max(90),
  cytology: CytologyBethesdaCodeSchema,
  hpvStatus: CytologyHpvStatusSchema,
  hpv16Positive: z.boolean().optional(),
  hpv18Positive: z.boolean().optional(),
  pregnant: z.boolean().optional(),
  immunodeficient: z.boolean().optional(),
  hivPositive: z.boolean().optional(),
  priorExcision: z.boolean().optional(),
  priorCytology: CytologyBethesdaCodeSchema.nullable().optional(),
  colposcopyDone: z.boolean().optional(),
  histology: NoPhiTextSchema.nullable().optional(),
});

export const CytologyQuizAnswerSchema = z.object({
  questionId: z.string().min(1),
  selectedIndex: z.number().int().min(0).max(10),
});

export const CytologyQuizResultSchema = z.object({
  total: z.number().int().min(0),
  answered: z.number().int().min(0),
  correct: z.number().int().min(0),
  incorrect: z.number().int().min(0),
  percentCorrect: z.number().min(0).max(100),
  recommendedTopics: z.array(z.string().min(1)),
});

export const SamplingChecklistSchema = z.object({
  stepsCompleted: z.array(z.number().int().min(1).max(10)),
});

export const CytologySamplingErrorSchema = z.object({
  id: z.string().min(1),
  title: NoPhiTextSchema,
  whyBad: NoPhiTextSchema,
  cytologistSees: NoPhiTextSchema,
  patientRisk: NoPhiTextSchema,
  fix: NoPhiTextSchema,
  prevent: NoPhiTextSchema,
});

export const BethesdaCategorySchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  title: z.string().min(1),
  plain: NoPhiTextSchema,
  histology: z.string().min(1),
  hpvLink: NoPhiTextSchema,
  doctorAction: NoPhiTextSchema,
  colposcopy: NoPhiTextSchema,
  biopsy: NoPhiTextSchema,
  referral: NoPhiTextSchema,
});

export const CytologyClinicalCaseSchema = z.object({
  id: z.string().min(1),
  title: NoPhiTextSchema,
  data: z.record(z.unknown()),
  question: NoPhiTextSchema,
  options: z.array(NoPhiTextSchema).min(2),
  correctIndex: z.number().int().min(0),
  explanation: NoPhiTextSchema,
  topicRef: z.string().min(1),
  casesChannel: z.string().min(1),
}).superRefine((value, ctx) => {
  if (value.correctIndex >= value.options.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["correctIndex"],
      message: "correctIndex должен указывать на существующий вариант ответа",
    });
  }
});
