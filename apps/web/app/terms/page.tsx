import type { Metadata } from "next";
import Link from "next/link";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sonogyn-pro.ru";

export const metadata: Metadata = {
  title: "Пользовательское соглашение",
  description:
    "Условия использования SonoGyn Pro — CDS и обучение для врачей УЗД/АГ. Не медицинский диагноз.",
  alternates: { canonical: "/terms" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: `${siteUrl}/terms`,
    siteName: "SonoGyn Pro",
    title: "Пользовательское соглашение — SonoGyn Pro",
    description: "Условия использования профессиональной платформы SonoGyn Pro.",
  },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--clinical-background,#0b1220)] text-[var(--clinical-foreground,#e8eef7)]">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--clinical-primary-deep,#7dd3fc)]">
          SonoGyn Pro
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Пользовательское соглашение
        </h1>
        <p className="mt-3 text-sm text-[var(--clinical-foreground-muted,#94a3b8)]">
          Документ продукта для App Store / веб-пилота. Не замена консультации юриста.
        </p>
        <p className="mt-2 text-xs text-[var(--clinical-foreground-muted,#64748b)]">
          Дата публикации: 3 ноября 2026 г. ·{" "}
          <a className="underline underline-offset-2" href="https://sonogyn-pro.ru">
            sonogyn-pro.ru
          </a>
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-slate-200">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">1. Стороны и аудитория</h2>
            <p>
              Сервис SonoGyn Pro («Сервис») предназначен исключительно для медицинских специалистов
              (врачи УЗД, акушеры-гинекологи, ординаторы, студенты медвузов). Пациенты не являются
              пользователями платформы. Оператор — владелец домена sonogyn-pro.ru. Контакт:{" "}
              <a className="underline underline-offset-2" href="mailto:Sonogyn-pro@mail.ru">
                Sonogyn-pro@mail.ru
              </a>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">2. Назначение</h2>
            <p>
              Сервис предоставляет справочные калькуляторы, образовательные материалы и вспомогательные
              инструменты clinical decision support (CDS). Результаты не являются медицинским диагнозом,
              назначением лечения или заменой очного осмотра. Интерпретацию выполняет специалист.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">3. Доступ</h2>
            <p>
              В пилотной версии iOS возможен гостевой доступ к калькуляторам после согласия с условиями.
              Регистрация (email) опциональна. Оператор вправе ограничить доступ при нарушении правил или
              закона.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">4. Запрещённый контент</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Персональные данные пациентов (ФИО, телефон, СНИЛС, полис, номер карты и т.п.).</li>
              <li>Оскорбления, угрозы, спам, незаконный контент.</li>
              <li>Публикация материалов, нарушающих права третьих лиц.</li>
            </ul>
            <p>
              Пользователи могут пожаловаться на контент в приложении и написать на{" "}
              <a className="underline underline-offset-2" href="mailto:Sonogyn-pro@mail.ru">
                Sonogyn-pro@mail.ru
              </a>
              . Оператор рассматривает обращения в разумный срок и вправе удалить контент или ограничить
              доступ.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">5. Подписка</h2>
            <p>
              Платные подписки через Apple App Store в текущем пилоте не предлагаются. При появлении
              оплат условия auto-renewable subscription и управление через Apple ID будут указаны на
              экране покупки и в карточке приложения.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">6. Конфиденциальность</h2>
            <p>
              Обработка данных описана в{" "}
              <Link href="/privacy" className="underline underline-offset-2">
                Политике конфиденциальности
              </Link>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">7. Ответственность</h2>
            <p>
              Сервис предоставляется «как есть». Оператор не отвечает за клинические решения,
              принятые пользователем. Максимальная ответственность ограничена в пределах, допустимых
              применимым правом.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">8. Изменения</h2>
            <p>
              Актуальная версия публикуется на этой странице. Существенные изменения сопровождаются
              обновлением даты редакции.
            </p>
          </section>
        </div>

        <div className="mt-12 flex flex-wrap gap-3 text-sm">
          <Link
            href="/privacy"
            className="rounded-xl bg-sky-500/90 px-4 py-2 font-medium text-slate-950 hover:bg-sky-400"
          >
            Политика конфиденциальности
          </Link>
          <Link
            href="/home"
            className="rounded-xl border border-white/15 px-4 py-2 text-slate-200 hover:bg-white/5"
          >
            В кабинет
          </Link>
        </div>
      </div>
    </main>
  );
}
