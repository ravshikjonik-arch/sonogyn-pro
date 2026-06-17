"use client";

import { useEffect, useState } from "react";

type AuthFeatures = { emailAutoConfirm?: boolean };

/** Подсказка на /register: сразу в кабинет или письмо на почту. */
export function EmailRegistrationHint() {
  const [autoConfirm, setAutoConfirm] = useState<boolean | null>(null);

  useEffect(() => {
    void fetch("/api/auth/status", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { features?: AuthFeatures }) => setAutoConfirm(Boolean(json.features?.emailAutoConfirm)))
      .catch(() => setAutoConfirm(false));
  }, []);

  if (autoConfirm === null) return null;

  if (autoConfirm) {
    return (
      <p className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
        После регистрации вы <strong>сразу попадёте в кабинет</strong> — email подтверждается на сервере (режим разработки).
      </p>
    );
  }

  return (
    <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
      На почту придёт <strong>письмо с подтверждением</strong> — откройте ссылку, затем войдите. Проверьте «Спам». Для локального теста без
      письма добавьте <span className="font-mono text-xs">SUPABASE_SERVICE_ROLE_KEY</span> в{" "}
      <span className="font-mono text-xs">apps/web/.env.local</span> и выполните{" "}
      <span className="font-mono text-xs">npm run setup:dev-login</span>.
    </p>
  );
}
