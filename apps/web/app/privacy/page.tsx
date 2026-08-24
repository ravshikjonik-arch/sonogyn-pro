import type { Metadata } from "next";
import Link from "next/link";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sonogyn-pro.ru";

export const metadata: Metadata = {
  title: "Политика конфиденциальности",
  description:
    "Политика обработки персональных данных SonoGyn Pro (152-ФЗ). Платформа для врачей; открытый доступ к калькуляторам без регистрации.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: `${siteUrl}/privacy`,
    siteName: "SonoGyn Pro",
    title: "Политика конфиденциальности — SonoGyn Pro",
    description: "Обработка персональных данных на платформе SonoGyn Pro.",
  },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--clinical-background, #0b1220)] text-[var(--clinical-foreground, #e8eef7)]">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--clinical-primary-deep,#7dd3fc)]">
          SonoGyn Pro
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Политика конфиденциальности
        </h1>
        <p className="mt-3 text-sm text-[var(--clinical-foreground-muted,#94a3b8)]">
          Редакция для открытого доступа. SonoGyn Pro — профессиональный сервис для врачей и
          специалистов УЗД/АГ, не для пациентов как пользователей. Ориентир — Федеральный закон №
          152-ФЗ «О персональных данных». Документ продукта, не замена консультации юриста.
        </p>
        <p className="mt-2 text-xs text-[var(--clinical-foreground-muted,#64748b)]">
          Дата публикации: 24 августа 2026 г. · Сайт:{" "}
          <a className="underline underline-offset-2" href="https://sonogyn-pro.ru">
            sonogyn-pro.ru
          </a>
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-slate-200">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">1. Оператор</h2>
            <p>
              Оператор сервиса SonoGyn Pro (далее — «Сервис») — владелец домена sonogyn-pro.ru.
              Контакт по вопросам ПДн:{" "}
              <a className="underline underline-offset-2" href="mailto:Sonogyn-pro@mail.ru">
                Sonogyn-pro@mail.ru
              </a>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">2. Аудитория и открытый доступ</h2>
            <p>
              Сервис предназначен исключительно для медицинских специалистов. Пациенты не
              регистрируются и не являются пользователями платформы. Калькуляторы, справочники и
              образовательные материалы доступны без регистрации. Не вводите в формы ФИО, телефон,
              СНИЛС, полис ОМС и иные идентификаторы пациентов — Сервис не предназначен для хранения
              персональных данных пациентов. За попытку сохранить такие данные аккаунт врача может быть
              заблокирован без предупреждения.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">2.1. Блокировка за нарушение</h2>
            <p>
              SonoGyn Pro — платформа исключительно для медицинских специалистов. Запрещено вводить и
              хранить персональные данные пациентов (ФИО, телефон, email, СНИЛС, полис ОМС, номер
              медицинской карты, паспортные данные и т.п.) в формах, кейсах, чатах и заметках. При
              обнаружении нарушения оператор вправе немедленно заблокировать учётную запись. Обжалование — на{" "}
              <a className="underline underline-offset-2" href="mailto:Sonogyn-pro@mail.ru">
                Sonogyn-pro@mail.ru
              </a>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">3. Какие данные обрабатываем</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>
                Данные аккаунта врача (при регистрации/входе): email, имя, специализация и иные поля
                профиля, которые вы указываете добровольно.
              </li>
              <li>
                Учебные кейсы и расчёты — только в обезличенном виде, без персональных данных
                пациентов; Сервис не собирает и не хранит карты пациентов.
              </li>
              <li>Технические данные: cookies/сессия, IP и User-Agent в объёме, нужном для безопасности и работы Сервиса.</li>
              <li>Платёжные данные — через платёжного провайдера (при подключении оплаты); полный номер карты Сервис не хранит.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">4. Цели обработки</h2>
            <ul className="list-disc space-y-1 pl-5">
              <li>Предоставление клинических инструментов поддержки решений (CDS) для специалистов.</li>
              <li>Аутентификация, безопасность, предотвращение злоупотреблений.</li>
              <li>Связь по запросам поддержки и уведомлениям, которые вы запросили.</li>
              <li>Исполнение договора / оферты при платном доступе (когда включён).</li>
            </ul>
            <p className="text-[var(--clinical-foreground-muted,#94a3b8)]">
              Сервис не ставит диагноз и не заменяет очный приём. Заключение и интерпретация — зона
              ответственности врача. Материалы носят вспомогательный характер.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">5. Правовые основания</h2>
            <p>
              Согласие субъекта (регистрация, вход, использование защищённых функций), исполнение
              договора/оферты, законные интересы оператора в части безопасности Сервиса — в рамках
              152-ФЗ.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">6. Хранение и передача</h2>
            <p>
              Данные обрабатываются с использованием облачной инфраструктуры: приложение (Vercel) и
              Auth/БД (Supabase, проект{" "}
              <span className="font-mono text-xs">ocqlsqqloqvlzutbgrnp</span>
              ). Регион размещения БД и аутентификации Supabase:{" "}
              <span className="font-mono text-xs">eu-west-1</span> (Ирландия, ЕС). Обрабатываются
              преимущественно данные аккаунтов врачей; это может означать трансграничную передачу
              персональных данных граждан РФ в рамках 152-ФЗ. Объектное хранилище по умолчанию
              ориентировано на <span className="font-mono text-xs">ru-central1</span>, если не задано
              иное.
            </p>
            <p>
              Доступ к данным аккаунта ограничивается аутентификацией и политиками безопасности; разделы
              кабинета не предназначены для публичной индексации поисковиками.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">7. Права субъекта ПДн</h2>
            <p>
              Авторизованный пользователь может в разделе «Профиль»: скачать выгрузку своих данных
              (JSON) и удалить аккаунт. Также можно написать на{" "}
              <a className="underline underline-offset-2" href="mailto:Sonogyn-pro@mail.ru">
                Sonogyn-pro@mail.ru
              </a>
              .
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">8. Cookies</h2>
            <p>
              Необходимые cookies сессии аутентификации используются всегда. Аналитика Firebase — только
              после согласия в баннере на сайте (если Firebase сконфигурирован).
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-white">9. Изменения</h2>
            <p>
              Актуальная версия публикуется на этой странице. Существенные изменения сопровождаются
              обновлением даты редакции.
            </p>
          </section>
        </div>

        <div className="mt-12 flex flex-wrap gap-3 text-sm">
          <Link
            href="/home"
            className="rounded-xl bg-sky-500/90 px-4 py-2 font-medium text-slate-950 hover:bg-sky-400"
          >
            В кабинет
          </Link>
          <Link
            href="/landing"
            className="rounded-xl border border-white/15 px-4 py-2 text-slate-200 hover:bg-white/5"
          >
            На лендинг
          </Link>
        </div>
      </div>
    </main>
  );
}
