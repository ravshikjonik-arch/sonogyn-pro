"use client";

import Link from "next/link";

type PhoneAuthSetupHintProps = {
  visible: boolean;
};

/** Подсказка, если SMS не настроен. */
export function PhoneAuthSetupHint({ visible }: PhoneAuthSetupHintProps) {
  if (!visible) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
      <p className="font-semibold">SMS пока не подключён</p>
      <p className="mt-1">
        Для РФ используйте <strong>SMS.ru</strong> (Twilio в регионе часто недоступен). В{" "}
        <span className="font-mono text-xs">apps/web/.env.local</span>:
      </p>
      <pre className="mt-2 overflow-x-auto rounded-lg bg-white/70 p-2 text-[11px] dark:bg-black/20">
{`SMS_PROVIDER=smsru
SMSRU_API_ID=ваш_api_id_с_sms.ru
# SMSRU_FROM=SonoGyn   # опционально`}
      </pre>
      <p className="mt-2 text-xs">
        Локально: <span className="font-mono">SMS_PROVIDER=mock</span> — код OTP в консоли сервера (
        <span className="font-mono">[auth:sms] mock_sent</span>).
      </p>
      <p className="mt-2 text-xs">
        Нужен также <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> — без него сессия после кода не
        создастся.
      </p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
        <li>
          <Link href="/register?method=email" className="font-semibold underline">
            Вход по Email
          </Link>
        </li>
        <li>
          <Link href="/register?method=telegram" className="font-semibold underline">
            Вход через Telegram
          </Link>
        </li>
      </ul>
    </div>
  );
}
