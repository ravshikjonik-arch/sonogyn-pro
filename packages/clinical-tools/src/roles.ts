import type { DoctorRole } from "./types";

/** Закреплённые инструменты по умолчанию для роли (id из catalog) */
export const DEFAULT_PINNED_TOOL_IDS: Record<DoctorRole, string[]> = {
  ultrasound: [
    "chat",
    "ob-calc",
    "orads",
    "birads",
    "tirads",
    "endometrium",
    "cervical-length",
    "elastography",
    "fmf",
  ],
  gynecologist: [
    "chat",
    "assistant-gyn",
    "ob-calc",
    "endometrium",
    "popq",
    "orads",
    "uterus-clinic",
    "fmf",
  ],
  obstetrician: [
    "chat",
    "ob-calc",
    "fmf",
    "cervical-length",
    "ga-lmp",
    "ga-crl",
    "assistant-obs",
    "new-case",
  ],
  allied: ["chat", "tirads", "ln-rads", "birads", "nosology", "new-case"],
};

export const DOCTOR_ROLE_LABELS: Record<DoctorRole, string> = {
  ultrasound: "Врач УЗИ",
  gynecologist: "Гинеколог",
  obstetrician: "Акушер",
  allied: "Смежный специалист",
};

export const DOCTOR_ROLE_HINTS: Record<DoctorRole, string> = {
  ultrasound: "O-RADS, BI-RADS, TI-RADS, эластография",
  gynecologist: "Помощник МКБ, эндометрий, POP-Q",
  obstetrician: "FMF, сроки, длина шейки",
  allied: "ЩЖ, ЛУ, МЖ, нозологии",
};
