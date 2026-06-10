"use client";

import Link from "next/link";

type PhoneAuthSetupHintProps = {
  visible: boolean;
};

/** Подсказка, если SMS-провайдер в Supabase не настроен. */
export function PhoneAuthSetupHint({ visible }: PhoneAuthSetupHintProps) {
  if (!visible) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
      <p className="font-semibold">SMS пока не подключён</p>
      <p className="mt-1">
        Код на телефон не отправится, пока в Supabase не включён Phone + Twilio. Сейчас надёжнее:
      </p>
      <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
        <li>
          <Link href="/register?method=email" className="font-semibold underline">
            Регистрация по Email
          </Link>
        </li>
        <li>
          <Link href="/register?method=social" className="font-semibold underline">
            Telegram / Google
          </Link>
        </li>
      </ul>
    </div>
  );
}
