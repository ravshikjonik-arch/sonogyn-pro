import type { Metadata } from "next";

import { LegalDocShell } from "@/components/legal/LegalDocShell";
import {
  MEDICAL_DEVICE_DISCLAIMER_RU,
  readLegalPublicProfile,
} from "@/lib/config/legal";
import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Контакты",
  description: "Контакты оператора SonoGyn Pro: поддержка и вопросы по персональным данным.",
  path: "/contacts",
  skipCdsDisclaimer: true,
});

export default function ContactsPage() {
  const legal = readLegalPublicProfile();

  return (
    <LegalDocShell
      title="Контакты"
      subtitle="Сервис для медицинских специалистов. Пациенты не регистрируются как пользователи платформы."
    >
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Оператор</h2>
        {legal.hasRegisteredEntity ? (
          <ul className="list-disc space-y-1 pl-5 text-[var(--clinical-foreground-muted)]">
            <li>{legal.entityName}</li>
            {legal.inn ? <li>ИНН {legal.inn}</li> : null}
            {legal.ogrn ? <li>ОГРН/ОГРНИП {legal.ogrn}</li> : null}
            {legal.address ? <li>Адрес: {legal.address}</li> : null}
          </ul>
        ) : (
          <p className="text-[var(--clinical-foreground-muted)]">
            Юридические реквизиты оператора (наименование, ИНН, ОГРН, адрес) будут опубликованы после
            заполнения переменных{" "}
            <code className="text-xs">NEXT_PUBLIC_LEGAL_ENTITY_NAME</code> и{" "}
            <code className="text-xs">NEXT_PUBLIC_LEGAL_INN</code>. До этого момента в публичных
            документах не указываются вымышленные ИНН.
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Связь</h2>
        <ul className="list-disc space-y-1 pl-5 text-[var(--clinical-foreground-muted)]">
          <li>
            Поддержка:{" "}
            <a className="underline underline-offset-2" href={`mailto:${legal.supportEmail}`}>
              {legal.supportEmail}
            </a>
          </li>
          <li>
            Вопросы по персональным данным:{" "}
            <a className="underline underline-offset-2" href={`mailto:${legal.pdnEmail}`}>
              {legal.pdnEmail}
            </a>
          </li>
          <li>{legal.responseHoursRu}</li>
        </ul>
        <p className="pt-2 text-xs text-[var(--clinical-foreground-muted)]">
          Телефон на сайте не публикуем — пишите в Telegram (@Yakrav7700) или на email. Блок «Нашли
          ошибку?» ниже открывает Telegram с адресом страницы.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Документы</h2>
        <p className="text-[var(--clinical-foreground-muted)]">
          Политика конфиденциальности, оферта и эта страница образуют доверительный контур веб-сервиса.
          Условия магазинов приложений (App Store / RuStore) публикуются отдельно при релизе сторов.
        </p>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">{MEDICAL_DEVICE_DISCLAIMER_RU}</p>
      </section>
    </LegalDocShell>
  );
}
