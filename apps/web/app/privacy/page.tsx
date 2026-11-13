import type { Metadata } from "next";
import Link from "next/link";

import { LegalDocShell } from "@/components/legal/LegalDocShell";
import {
  CROSS_BORDER_TRANSFER_TODO_RU,
  MEDICAL_DEVICE_DISCLAIMER_RU,
  readLegalPublicProfile,
} from "@/lib/config/legal";
import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Политика конфиденциальности",
  description:
    "Политика обработки персональных данных SonoGyn Pro (152-ФЗ). Платформа для врачей; открытый доступ к калькуляторам без регистрации.",
  path: "/privacy",
  skipCdsDisclaimer: true,
});

export default function PrivacyPage() {
  const legal = readLegalPublicProfile();

  return (
    <LegalDocShell
      title="Политика конфиденциальности"
      subtitle="Ориентир — Федеральный закон № 152-ФЗ «О персональных данных». SonoGyn Pro — профессиональный сервис для врачей и специалистов УЗД/АГ, не для пациентов как пользователей."
    >
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">1. Оператор</h2>
        {legal.hasRegisteredEntity ? (
          <p className="text-[var(--clinical-foreground-muted)]">
            Оператор: {legal.entityName}, ИНН {legal.inn}
            {legal.ogrn ? `, ОГРН/ОГРНИП ${legal.ogrn}` : ""}
            {legal.address ? `; адрес: ${legal.address}` : ""}.
          </p>
        ) : (
          <p className="text-[var(--clinical-foreground-muted)]">
            Оператор сервиса SonoGyn Pro — лицо, осуществляющее обработку ПДн на домене sonogyn-pro.ru.
            Полные реквизиты (наименование, ИНН, ОГРН, адрес) публикуются после заполнения env{" "}
            <code className="text-xs">NEXT_PUBLIC_LEGAL_*</code> и не подставляются шаблонными значениями.
          </p>
        )}
        <p className="text-[var(--clinical-foreground-muted)]">
          Контакт по вопросам ПДн:{" "}
          <a className="underline underline-offset-2" href={`mailto:${legal.pdnEmail}`}>
            {legal.pdnEmail}
          </a>
          . Поддержка:{" "}
          <a className="underline underline-offset-2" href={`mailto:${legal.supportEmail}`}>
            {legal.supportEmail}
          </a>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">2. Аудитория и запрет ПДн пациентов</h2>
        <p className="text-[var(--clinical-foreground-muted)]">
          Сервис предназначен исключительно для медицинских специалистов. Пациенты не регистрируются.
          Калькуляторы и справочники доступны без регистрации. Не вводите ФИО, телефон, СНИЛС, полис ОМС
          и иные идентификаторы пациентов. При обнаружении таких данных оператор вправе заблокировать
          учётную запись.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">3. Какие данные обрабатываем</h2>
        <ul className="list-disc space-y-1 pl-5 text-[var(--clinical-foreground-muted)]">
          <li>Данные аккаунта врача: email, имя, телефон (если указан), специализация, поля профиля.</li>
          <li>Факт согласия с Политикой и Офертой (дата и версия документов) при регистрации.</li>
          <li>Учебные кейсы и расчёты — обезличенно, без ПДн пациентов.</li>
          <li>Технические данные: cookies сессии, IP и User-Agent в объёме безопасности.</li>
          <li>Платёжные данные — у платёжного провайдера; полный номер карты Сервис не хранит.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">4. Цели и правовые основания</h2>
        <ul className="list-disc space-y-1 pl-5 text-[var(--clinical-foreground-muted)]">
          <li>Предоставление CDS-инструментов для специалистов.</li>
          <li>Аутентификация, безопасность, поддержка.</li>
          <li>Исполнение оферты при платном доступе (когда включён).</li>
        </ul>
        <p className="text-[var(--clinical-foreground-muted)]">
          Основания: согласие субъекта; исполнение договора/оферты; законные интересы оператора в части
          безопасности — в рамках 152-ФЗ. {MEDICAL_DEVICE_DISCLAIMER_RU}
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">5. Сроки хранения</h2>
        <p className="text-[var(--clinical-foreground-muted)]">
          Данные аккаунта хранятся, пока аккаунт активен, либо до удаления по запросу пользователя /
          блокировки за нарушение. Технические журналы безопасности — ограниченный срок, необходимый для
          расследования инцидентов. После удаления аккаунта данные удаляются или обезличиваются в
          разумный срок, за исключением случаев, когда хранение требуется законом.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">6. Хранение и трансграничная передача</h2>
        <p className="text-[var(--clinical-foreground-muted)]">
          Приложение размещается на инфраструктуре Vercel. Auth и база данных — Supabase. Фактический
          регион проекта Supabase на момент публикации политики:{" "}
          <span className="font-mono text-xs">eu-west-1</span> (Ирландия, ЕС). Это означает, что
          персональные данные аккаунтов врачей граждан РФ обрабатываются с участием инфраструктуры за
          пределами РФ.
        </p>
        <p className="text-xs text-amber-800 dark:text-amber-200">
          TODO для оператора (выбрать и закрепить с юристом):
        </p>
        <ul className="list-disc space-y-1 pl-5 text-xs text-[var(--clinical-foreground-muted)]">
          {CROSS_BORDER_TRANSFER_TODO_RU.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">7. Права субъекта</h2>
        <p className="text-[var(--clinical-foreground-muted)]">
          Авторизованный пользователь может в «Профиле» запросить выгрузку данных и удаление аккаунта,
          либо написать на{" "}
          <a className="underline underline-offset-2" href={`mailto:${legal.pdnEmail}`}>
            {legal.pdnEmail}
          </a>
          . Отзыв согласия на обработку ПДн, необходимую для работы аккаунта, влечёт прекращение доступа
          к кабинету.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">8. Cookies</h2>
        <p className="text-[var(--clinical-foreground-muted)]">
          Необходимые cookies сессии используются всегда. Аналитика — только после согласия в баннере
          (если счётчики подключены).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">9. Изменения</h2>
        <p className="text-[var(--clinical-foreground-muted)]">
          Актуальная версия — на этой странице (редакция {legal.docsVersion}). См. также{" "}
          <Link href="/offer" className="underline underline-offset-2">
            Оферту
          </Link>{" "}
          и{" "}
          <Link href="/contacts" className="underline underline-offset-2">
            Контакты
          </Link>
          .
        </p>
      </section>
    </LegalDocShell>
  );
}
