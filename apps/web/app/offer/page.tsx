import type { Metadata } from "next";
import Link from "next/link";

import { LegalDocShell } from "@/components/legal/LegalDocShell";
import {
  MEDICAL_DEVICE_DISCLAIMER_RU,
  readLegalPublicProfile,
} from "@/lib/config/legal";
import { formatProPriceRub, PAYMENT_PROVIDER_PUBLIC_NAME_RU } from "@/lib/config/platform";
import { readDefaultProPriceRub } from "@/lib/payment/config";
import { resolveProCheckoutPublicState } from "@/lib/payment/pro-checkout-public";
import { buildPublicMetadata } from "@/lib/seo/build-public-metadata";

export const metadata: Metadata = buildPublicMetadata({
  title: "Публичная оферта",
  description: "Условия использования веб-сервиса SonoGyn Pro и подписки PRO.",
  path: "/offer",
  skipCdsDisclaimer: true,
});

export default function OfferPage() {
  const legal = readLegalPublicProfile();
  const price = formatProPriceRub(readDefaultProPriceRub());
  const checkout = resolveProCheckoutPublicState();
  const paymentsLive = checkout.yookassaReady || checkout.stripeFallbackReady;

  return (
    <LegalDocShell
      title="Публичная оферта"
      subtitle="Договор присоединения на использование веб-сервиса SonoGyn Pro. Черновик для публикации; финальную редакцию проверяет юрист."
    >
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">1. Предмет</h2>
        <p className="text-[var(--clinical-foreground-muted)]">
          Оператор предоставляет Пользователю (медицинскому специалисту) доступ к веб-сервису SonoGyn
          Pro: калькуляторы и справочные материалы CDS, кабинет, образовательные модули и связанные
          функции согласно тарифу. {MEDICAL_DEVICE_DISCLAIMER_RU} Сервис не ставит диагноз и не заменяет
          очный приём.
        </p>
        {!legal.hasRegisteredEntity ? (
          <p className="text-xs text-amber-700 dark:text-amber-200">
            TODO: после заполнения NEXT_PUBLIC_LEGAL_* в преамбуле оферты будет указано полное
            наименование и ИНН оператора.
          </p>
        ) : (
          <p className="text-[var(--clinical-foreground-muted)]">
            Оператор: {legal.entityName}, ИНН {legal.inn}
            {legal.ogrn ? `, ОГРН/ОГРНИП ${legal.ogrn}` : ""}.
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">2. Регистрация и бесплатный доступ</h2>
        <p className="text-[var(--clinical-foreground-muted)]">
          Часть функций доступна без регистрации (демо-кабинет). Регистрация аккаунта врача означает
          согласие с{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            Политикой
          </Link>{" "}
          и настоящей Офертой. Запрещено вносить персональные данные пациентов.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">3. Стоимость и оплата</h2>
        <p className="text-[var(--clinical-foreground-muted)]">
          Подписка PRO (веб): ориентир витрины {price} / 30 дней, если оплата включена на окружении.
          {paymentsLive
            ? ` Приём платежей: ${PAYMENT_PROVIDER_PUBLIC_NAME_RU}${checkout.stripeFallbackReady && !checkout.yookassaReady ? " (запасной канал)" : ""}.`
            : " Пока платёжный провайдер не включён, цена и кнопка оплаты на витрине скрыты — без обещания «оплатить сейчас»."}{" "}
          Актуальный статус — на странице{" "}
          <Link href="/pricing" className="underline underline-offset-2">
            /pricing
          </Link>
          .
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">4. Срок и возврат</h2>
        <p className="text-[var(--clinical-foreground-muted)]">
          Доступ PRO действует в течение оплаченного периода. Запрос на возврат — на{" "}
          <a className="underline underline-offset-2" href={`mailto:${legal.supportEmail}`}>
            {legal.supportEmail}
          </a>
          . Порядок возврата уточняется оператором с учётом правил платёжного провайдера и применимого
          законодательства РФ; детали возврата для сторов приложений — в отдельных условиях магазина.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">5. Ответственность</h2>
        <p className="text-[var(--clinical-foreground-muted)]">
          Пользователь самостоятельно принимает клинические решения. Оператор не несёт ответственности
          за ущерб вследствие использования справочных расчётов без профессиональной оценки. Сервис
          предоставляется «как есть» в объёме, доступном на момент использования.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">6. Изменение условий</h2>
        <p className="text-[var(--clinical-foreground-muted)]">
          Актуальная редакция публикуется на этой странице с указанием версии документов (
          {legal.docsVersion}). Существенные изменения доводятся через сайт и/или уведомление в кабинете.
        </p>
      </section>
    </LegalDocShell>
  );
}
