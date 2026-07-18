import type { DoctorRole } from "./types";

/** Закреплённые инструменты по умолчанию для роли (id из catalog) */
export const DEFAULT_PINNED_TOOL_IDS: Record<DoctorRole, string[]> = {
  ultrasound: [
    "chat",
    "assistant-us",
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
    "assistant-us",
    "ob-calc",
    "endometrium",
    "popq",
    "orads",
    "uterus-clinic",
    "fmf",
  ],
  obstetrician: [
    "chat",
    "assistant-obs",
    "ob-calc",
    "fmf",
    "cervical-length",
    "ga-lmp",
    "ga-crl",
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
  ultrasound: "Помощник врача УЗИ, O-RADS, BI-RADS, TI-RADS",
  gynecologist: "Помощник врача-гинеколога, эндометрий, POP-Q",
  obstetrician: "Помощник врача-акушера, FMF, сроки, шейка",
  allied: "ЩЖ, ЛУ, МЖ, нозологии",
};
