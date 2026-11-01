"use client";

import Link from "next/link";

import { TelegramLoginButton } from "@/components/auth/TelegramLoginButton";
import { isPilotClosedAccessClient } from "@/lib/auth/auth-pilot-config";
import { readTelegramBotDisplayName } from "@/lib/auth/registration-methods";

type Props = {
  mode: "login" | "register";
  nextPath?: string;
  message?: string;
  onRegisterClick?: () => void;
  registerLoading?: boolean;
};

export function TelegramSimpleAuth({
  mode,
  nextPath = "/app",
  message,
  onRegisterClick,
  registerLoading = false,
}: Props) {
  const botName = readTelegramBotDisplayName();
  const closed = isPilotClosedAccessClient();

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
        <p className="font-semibold">
          {mode === "login" ? "Вход через Telegram" : "Регистрация через Telegram"}
        </p>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-emerald-900 dark:text-emerald-200">
          {mode === "register" ? (
            <li>Заполните ФИО и дату рождения ниже</li>
          ) : null}
          <li>
            {mode === "login"
              ? "Нажмите кнопку — Telegram подтвердит вход (пароль не нужен)"
              : "Нажмите «Подтвердить через Telegram» — откроется авторизация"}
          </li>
          <li>Телефон для уведомлений подтверждается по SMS (+7), не через бота</li>
        </ol>
        <p className="mt-2 text-xs text-emerald-800 dark:text-emerald-300">
          Бот {botName}: ID и @ник вводить не нужно. Коды подтверждения телефона приходят по SMS.
        </p>
      </div>

      {message ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {message}
        </p>
      ) : null}

      {mode === "register" && onRegisterClick ? (
        <button
          type="button"
          className="flex w-full items-center justify-center rounded-2xl bg-[var(--clinical-primary-deep)] px-4 py-4 text-base font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          disabled={registerLoading}
          onClick={onRegisterClick}
        >
          {registerLoading ? "Подготовка…" : "Подтвердить через Telegram"}
        </button>
      ) : (
        <TelegramLoginButton botUsername={botName} nextPath={nextPath} mode="redirect" enabled />
      )}

      {mode === "login" ? (
        <p className="text-center text-xs text-slate-500">
          {closed ? (
            <>
              Нет аккаунта?{" "}
              <Link
                href="/register?method=telegram"
                className="font-semibold text-[var(--clinical-primary-deep)] underline"
              >
                Регистрация в тестовый период
              </Link>
            </>
          ) : (
            <>
              Первый раз?{" "}
              <Link
                href="/register?method=telegram"
                className="font-semibold text-[var(--clinical-primary-deep)] underline"
              >
                Регистрация
              </Link>
            </>
          )}
        </p>
      ) : null}
    </div>
  );
}
