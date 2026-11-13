"use client";

import { FileText, Route } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FMF_SECOND_THIRD_PROTOCOL_TEMPLATES,
} from "@/lib/clinical-assistant/fmf-protocol-templates";
import type { SecondThirdProtocolTemplateId } from "@repo/types";
import { cn } from "@/lib/utils/cn";

type Props = {
  value: SecondThirdProtocolTemplateId;
  onChange: (id: SecondThirdProtocolTemplateId) => void | Promise<void>;
  className?: string;
  loading?: boolean;
  syncing?: boolean;
  syncError?: string | null;
  syncedToProfile?: boolean;
};

/** Выбор шаблона протокола II/III скрининга — сохраняется в профиле врача. */
export function FmfProtocolTemplatePicker({
  value,
  onChange,
  className,
  loading,
  syncing,
  syncError,
  syncedToProfile,
}: Props) {
  return (
    <Card className={cn("border-teal-200/70 bg-teal-50/30 dark:border-teal-900/40 dark:bg-teal-950/20", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-2">
          <FileText className="mt-0.5 h-4 w-4 text-teal-700 dark:text-teal-300" />
          <div>
            <CardTitle className="text-base">Шаблон протокола</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Основной — Якубов Р.В. (УЗИ + допплер II–III скрин). Выбор сохраняется в профиле врача и
              синхронизируется между устройствами.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading ? (
          <p className="text-xs text-[var(--clinical-foreground-muted)]">Загрузка настроек профиля…</p>
        ) : null}
        {syncing ? (
          <p className="text-xs text-teal-800 dark:text-teal-200">Сохранение в профиль…</p>
        ) : syncedToProfile && !syncError ? (
          <p className="text-xs text-emerald-700 dark:text-emerald-300">Синхронизировано с профилем</p>
        ) : null}
        {syncError ? <p className="text-xs text-amber-800 dark:text-amber-200">{syncError}</p> : null}
        {FMF_SECOND_THIRD_PROTOCOL_TEMPLATES.map((tpl) => {
          const selected = value === tpl.id;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => void onChange(tpl.id)}
              disabled={loading || syncing}
              className={cn(
                "w-full rounded-xl border px-3 py-2.5 text-left transition",
                selected
                  ? "border-teal-600 bg-white shadow-sm dark:border-teal-500 dark:bg-teal-950/40"
                  : "border-[var(--clinical-border)] bg-white/60 hover:border-teal-300 dark:bg-slate-900/30",
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-[var(--clinical-foreground)]">{tpl.label}</span>
                {tpl.defaultForSecondThird ? (
                  <Badge className="bg-teal-600 text-[10px]">по умолчанию</Badge>
                ) : null}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">{tpl.description}</p>
              {tpl.author ? (
                <p className="mt-1 text-[10px] text-[var(--clinical-foreground-muted)]">Автор: {tpl.author}</p>
              ) : null}
            </button>
          );
        })}
        <Link
          href="/ai/consultants/fmf/guided"
          className="flex w-full items-start gap-2 rounded-xl border border-dashed border-teal-500/60 bg-teal-500/5 px-3 py-2.5 text-left transition hover:border-teal-500 hover:bg-teal-500/10"
        >
          <Route className="mt-0.5 h-4 w-4 shrink-0 text-teal-700 dark:text-teal-300" aria-hidden />
          <span>
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">SonoGyn · по сроку (guided)</span>
              <Badge variant="outline" className="text-[10px]">
                beyond Astraia
              </Badge>
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
              Пошагово: что смотреть и измерить по окну GA (I / II / III). Не заменяет текстовые шаблоны
              выше — отдельный сценарий исследования.
            </span>
          </span>
        </Link>
      </CardContent>
    </Card>
  );
}
