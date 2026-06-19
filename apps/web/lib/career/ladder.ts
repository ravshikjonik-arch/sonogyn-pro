import type { LucideIcon } from "lucide-react";
import { GraduationCap, Sparkles, Stethoscope, UserRound } from "lucide-react";

export type CareerStageId = "guest" | "student" | "intern" | "doctor" | "pro";

export type CareerStage = {
  id: CareerStageId;
  order: number;
  title: string;
  badge: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  priceLabel: string;
  unlocks: string[];
  /** Что откроется на СЛЕДУЮЩЕМ шаге — для мотивации */
  nextTeaser?: string[];
};

export const CAREER_STAGES: CareerStage[] = [
  {
    id: "student",
    order: 1,
    title: "Студент",
    badge: "Старт",
    tagline: "Первый контакт с платформой",
    description: "Бесплатно познакомьтесь с материалами ISUOG, открытыми калькуляторами и витриной курсов.",
    icon: GraduationCap,
    priceLabel: "0 ₽",
    unlocks: ["Главная и библиотека", "Демо эластографии", "Регистрация за 2 минуты"],
    nextTeaser: ["Личный кабинет", "Калькуляторы O-RADS / FIGO", "Кейсы коллег"],
  },
  {
    id: "intern",
    order: 2,
    title: "Ординатор",
    badge: "Курс",
    tagline: "Запись на курс автора",
    description: "Запишитесь на курс (бесплатный или платный) — откроется ординаторский статус и материалы программы.",
    icon: UserRound,
    priceLabel: "от 0 ₽",
    unlocks: ["Доступ к курсу", "Модули и уроки", "Шаг к статусу «Врач»"],
    nextTeaser: ["Полный кабинет", "Чат врачей и кейсы", "КР и 3D-макеты"],
  },
  {
    id: "doctor",
    order: 3,
    title: "Врач",
    badge: "Практика",
    tagline: "Профиль + курс",
    description: "Профиль врача заполнен и курс подключён — полный клинический набор на Free.",
    icon: Stethoscope,
    priceLabel: "0 ₽",
    unlocks: ["Все базовые модули", "Помощник врача", "Образовательные курсы (лимиты)"],
    nextTeaser: ["PRO без лимитов AI", "Приоритет в кейсах", "Оплата картой РФ"],
  },
  {
    id: "pro",
    order: 4,
    title: "PRO",
    badge: "Масштаб",
    tagline: "Без потолка",
    description: "Подписка для тех, кто ведёт поток кейсов и хочет AI-очередь без ограничений Free.",
    icon: Sparkles,
    priceLabel: "от 990 ₽ / 30 дн.",
    unlocks: ["Безлимит AI-разборов", "Расширенные квоты кейсов", "ЮKassa · чек на email"],
  },
];

export type CareerProgress = {
  currentStage: CareerStageId;
  nextStage: CareerStageId | null;
  progressPercent: number;
  headline: string;
  subline: string;
  ctaLabel: string;
  ctaHref: string;
  completedStageIds: CareerStageId[];
  lockedPreview: string[];
};

export function getStageById(id: CareerStageId): CareerStage | undefined {
  return CAREER_STAGES.find((s) => s.id === id);
}
