import {
  PAY_PROVIDER_FALLBACK_ENABLED,
  PAYMENT_PROVIDER_PUBLIC_NAME_RU,
  STRIPE_FALLBACK_PUBLIC_NAME,
  SUPPORT_EMAIL,
} from "@/lib/config/platform";
import { isYooKassaConfigured } from "@/lib/payment/config";

export type ProCheckoutPublicState = {
  yookassaReady: boolean;
  stripeFallbackReady: boolean;
  ctaLabel: string;
  footnote: string;
};

export function resolveProCheckoutPublicState(): ProCheckoutPublicState {
  const yookassaReady = isYooKassaConfigured();
  const stripeFallbackReady = Boolean(
    PAY_PROVIDER_FALLBACK_ENABLED && process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY?.trim(),
  );

  if (yookassaReady) {
    return {
      yookassaReady: true,
      stripeFallbackReady,
      ctaLabel: `Войти и оплатить через ${PAYMENT_PROVIDER_PUBLIC_NAME_RU}`,
      footnote: `После входа откроется /paywall с оплатой ${PAYMENT_PROVIDER_PUBLIC_NAME_RU} (карта РФ, чек на email).`,
    };
  }

  if (stripeFallbackReady) {
    return {
      yookassaReady: false,
      stripeFallbackReady: true,
      ctaLabel: "Войти и оформить PRO",
      footnote: `${PAYMENT_PROVIDER_PUBLIC_NAME_RU} на этом окружении не настроена — на /paywall доступен запасной канал (${STRIPE_FALLBACK_PUBLIC_NAME}).`,
    };
  }

  return {
    yookassaReady: false,
    stripeFallbackReady: false,
    ctaLabel: "Написать о PRO",
    footnote: `Подписка PRO в подготовке — без цены и без оплаты на этом окружении. Вопросы: ${SUPPORT_EMAIL}.`,
  };
}
