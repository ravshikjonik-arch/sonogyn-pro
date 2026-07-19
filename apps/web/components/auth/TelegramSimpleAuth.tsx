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
          {mode === "login" ? "Вход в 2 шага" : "Регистрация в 3 шага"}
        </p>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-emerald-900 dark:text-emerald-200">
          <li>
            Откройте {botName} в Telegram и нажмите <strong>Start</strong>
          </li>
          {mode === "register" ? (
            <li>Заполните данные врача ниже и нажмите «Подтвердить через Telegram»</li>
          ) : null}
          <li>
            {mode === "login"
              ? "Нажмите кнопку ниже — Telegram подтвердит вход"
              : "Telegram откроется — подтвердите аккаунт"}
          </li>
        </ol>
        <p className="mt-2 text-xs text-emerald-800 dark:text-emerald-300">
          ID и @ник вводить не нужно — Telegram подставит их сам.
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
                Регистрация для участников пилота
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
