import {
  Activity,
  Brain,
  Calculator,
  CreditCard,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

export type LandingFeature = {
  icon: LucideIcon;
  title: string;
  body: string;
};

export type LandingStep = {
  step: string;
  title: string;
  body: string;
};

export type LandingFaqItem = {
  question: string;
  answer: string;
};

export type GuestAccessTier = {
  title: string;
  badge: string;
  description: string;
  items: { label: string; href: string; note?: string; locked?: boolean }[];
};

export const LANDING_FEATURES: LandingFeature[] = [
  {
    icon: Calculator,
    title: "Калькуляторы по гайдлайнам",
    body: "O-RADS · IOTA · BI-RADS · TI-RADS · FIGO · FMF — сценарии без «каши», только клиническая логика.",
  },
  {
    icon: ScanLine,
    title: "3D и визуализация",
    body: "FIGO-матка, BI-RADS молочной железы, IDEA — для разбора сложных случаев в кабинете.",
  },
  {
    icon: Activity,
    title: "Кейсы и обсуждения",
    body: "Лента снимков между коллегами: комментарии, закладки — как рабочая группа в отделении.",
  },
  {
    icon: Brain,
    title: "AI как ассистент",
    body: "Структурированные черновики и CDS-подсказки. Не диагноз — интерпретация остаётся за врачом.",
  },
];

export const LANDING_HOW_IT_WORKS: LandingStep[] = [
  {
    step: "1",
    title: "Регистрация",
    body: "Email, телефон или OAuth. Укажите ФИО, дату рождения и специализацию — один аккаунт для web и mobile.",
  },
  {
    step: "2",
    title: "Кабинет",
    body: "Рабочий стол: калькуляторы, 3D, КР, кейсы — единое меню без лишних кликов.",
  },
  {
    step: "3",
    title: "PRO при необходимости",
    body: "Расширенные лимиты и оплата через ЮKassa — когда готовы масштабировать практику.",
  },
];

export const LANDING_STATS = [
  { value: "15+", label: "калькуляторов и модулей" },
  { value: "91", label: "КР МЗ РФ в каталоге" },
  { value: "3D", label: "процедурные модели" },
  { value: "RU", label: "базовый язык интерфейса" },
];

export const LANDING_FAQ: LandingFaqItem[] = [
  {
    question: "Это медицинское изделие?",
    answer:
      "SonoGyn Pro — образовательная и ассистивная платформа для врачей. Заключение и клиническое решение всегда остаются за специалистом. Продукт не заменяет очный осмотр и не является зарегистрированным медизделием без отдельной процедуры.",
  },
  {
    question: "Что доступно без регистрации?",
    answer:
      "Гостевой режим: главная страница, тарифы и открытые демо-материалы (например, калькулятор эластографии). Кабинет, кейсы и большинство инструментов — после входа.",
  },
  {
    question: "Как оформить PRO?",
    answer:
      "Войдите в аккаунт и откройте раздел оплаты (/paywall). Подписка PRO оформляется через ЮKassa (карты РФ). Бесплатный тариф остаётся для знакомства с платформой.",
  },
  {
    question: "Можно ли пользоваться с телефона?",
    answer:
      "Да. Веб-версия работает как PWA на рабочем столе; мобильное приложение использует тот же аккаунт и сценарии.",
  },
  {
    question: "Как защищены данные?",
    answer:
      "Supabase Auth, RLS, шифрование чувствительных полей профиля. Перед клиническим применением с PHI рекомендуем аудит политик и договорённостей с вашей организацией.",
  },
];

export const GUEST_ACCESS_TIERS: GuestAccessTier[] = [
  {
    title: "Студент",
    badge: "Шаг 1 · 0 ₽",
    description: "Регистрация и знакомство — без оплаты.",
    items: [
      { label: "Курсы авторов", href: "/library/courses" },
      { label: "Калькулятор эластографии", href: "/tools/calc/gyn/elastography" },
      { label: "Клинический кабинет", href: "/register?next=/app", note: "после регистрации" },
    ],
  },
  {
    title: "Ординатор / Врач",
    badge: "Шаг 2–3 · 0 ₽",
    description: "Профиль врача → полный кабинет на Free.",
    items: [
      { label: "Заполнить профиль", href: "/register?next=/profile" },
      { label: "Кабинет и кейсы", href: "/register?next=/app" },
      { label: "Курсы авторов", href: "/register?next=/author/courses", note: "лимиты Free" },
    ],
  },
  {
    title: "PRO",
    badge: "Шаг 4 · оплата",
    description: "Снимите лимиты — когда готовы к потоку кейсов.",
    items: [
      { label: "Оформить PRO", href: "/login?next=/paywall" },
      { label: "Безлимит AI", href: "/login?next=/paywall", locked: true },
      { label: "ЮKassa · 30 дней", href: "/landing#pricing" },
    ],
  },
];

export const LANDING_PILLARS = [
  {
    icon: Stethoscope,
    title: "FIGO · матка · аденомиоз",
    body: "3D-срез, маркеры миом, ниша рубца — учебный и рабочий режим.",
  },
  {
    icon: Sparkles,
    title: "PWA + мобильное",
    body: "Сайт на рабочий стол; Android/iOS — тот же аккаунт (часть функций в разработке).",
  },
  {
    icon: ShieldCheck,
    title: "Безопасность данных",
    body: "Supabase Auth, RLS, шифрование — готовность к аудиту.",
  },
];

export const PRICING_PLANS = [
  {
    id: "free",
    title: "Free",
    price: "0 ₽",
    period: "навсегда",
    description: "Знакомство с калькуляторами и открытыми материалами.",
    features: ["Клинический shell", "Базовые калькуляторы", "Лимиты на AI и кейсы PRO"],
    cta: "Начать бесплатно",
    href: "/register",
    highlighted: false,
  },
  {
    id: "pro",
    title: "PRO",
    price: "от 990 ₽",
    period: "30 дней",
    description: "Подписка с оплатой через ЮKassa. Полный доступ к квотам платформы.",
    features: [
      "Расширенные лимиты кейсов",
      "Очередь AI-анализа",
      "Оплата картой РФ, чек на email",
    ],
    cta: "Войти и оформить PRO",
    href: "/login?next=/paywall",
    highlighted: true,
    icon: CreditCard,
  },
] as const;
