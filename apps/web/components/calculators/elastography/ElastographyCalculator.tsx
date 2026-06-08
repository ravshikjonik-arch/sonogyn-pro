"use client";

import Link from "next/link";
import { useTransition } from "react";
import { toast } from "sonner";

import { saveCalculatorEntry } from "@/app/actions/calculator-actions";
import { useElastographyWeb } from "@/components/calculators/elastography/useElastographyWeb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ELASTO_DISCLAIMER,
  METHOD_LABELS,
  ORGAN_LABELS,
  ORGAN_METHODS,
} from "@/lib/calculators/elastography/fieldDefinitions";
import { RISK_COLORS } from "@repo/medical-calculations/elastography";

const STEP_LABELS = {
  organ: "Выбор органа",
  method: "Метод эластографии",
  input: "Ввод параметров",
  result: "Заключение",
} as const;

function riskLabel(cat: string): string {
  if (cat === "low") return "Низкий риск";
  if (cat === "high") return "Высокий риск";
  return "Промежуточный риск";
}

export function ElastographyCalculator() {
  const el = useElastographyWeb();
  const [pending, startTransition] = useTransition();

  function onSave() {
    const result = el.result;
    const organ = el.organ;
    const method = el.method;
    if (!result || !organ || !method) return;
    startTransition(() => {
      void saveCalculatorEntry({
        slug: "elastography",
        calculatorCode: "ELASTOGRAPHY",
        payload: {
          organ,
          method,
          patientName: el.patientName || null,
          input: { ...el.values, myometriumType: el.myometriumType, ovaryIotaType: el.ovaryIotaType },
          result,
        },
        summary: `${ORGAN_LABELS[organ]} · ${riskLabel(result.riskCategory)} · ${result.value.toFixed(2)}`,
      }).then((res) => {
        if (res.ok) toast.success("Результат сохранён в истории калькуляторов");
        else toast.error(res.message);
      });
    });
  }

  return (
    <div className="space-y-6 px-4 py-10 lg:px-10">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/calculators">← Каталог калькуляторов</Link>
        </Button>
        <Badge variant="outline">ELASTOGRAPHY</Badge>
      </div>

      <header className="mx-auto max-w-3xl space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Эластография</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Strain / SWE — шейка, миометрий, яичники, МЖ. Общий расчёт с мобильным приложением.
        </p>
        <p className="text-xs font-medium text-violet-700 dark:text-violet-300">Шаг: {STEP_LABELS[el.step]}</p>
      </header>

      <div className="mx-auto max-w-3xl space-y-6">
        {el.step === "organ" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(ORGAN_LABELS) as (keyof typeof ORGAN_LABELS)[]).map((key) => (
              <Button
                key={key}
                variant="secondary"
                className="h-auto flex-col items-start gap-1 px-4 py-4 text-left"
                onClick={() => el.selectOrgan(key)}
              >
                <span className="font-semibold">{ORGAN_LABELS[key]}</span>
                <span className="text-xs font-normal text-[var(--clinical-foreground-muted)]">
                  {ORGAN_METHODS[key].map((m) => METHOD_LABELS[m]).join(" · ")}
                </span>
              </Button>
            ))}
          </div>
        ) : null}

        {el.step === "method" && el.organ ? (
          <Card>
            <CardHeader>
              <CardTitle>{ORGAN_LABELS[el.organ]}</CardTitle>
              <CardDescription>Выберите метод измерения</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {el.availableMethods.map((m) => (
                <Button key={m} variant="secondary" onClick={() => el.selectMethod(m)}>
                  {METHOD_LABELS[m]}
                </Button>
              ))}
              <Button variant="ghost" onClick={el.goBack}>
                ← Назад
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {el.step === "input" && el.organ && el.method ? (
          <Card>
            <CardHeader>
              <CardTitle>
                {ORGAN_LABELS[el.organ]} · {METHOD_LABELS[el.method]}
              </CardTitle>
              <CardDescription>Введите параметры с прибора</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
                  Пациент (необязательно)
                </label>
                <Input
                  value={el.patientName}
                  onChange={(e) => el.setPatientName(e.target.value)}
                  placeholder="ФИО или идентификатор"
                />
              </div>

              {el.organ === "myometrium" ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">Тип образования</p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["fibroid", "Миома"],
                        ["adenomyosis", "Аденомиоз"],
                        ["unclear", "Неясно"],
                      ] as const
                    ).map(([value, label]) => (
                      <Button
                        key={value}
                        size="sm"
                        variant={el.myometriumType === value ? "default" : "outline"}
                        onClick={() => el.setMyometriumType(value)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}

              {el.organ === "ovary" ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">IOTA-тип</p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["cyst", "Киста"],
                        ["endometrioma", "Эндометриома"],
                        ["solid", "Solid"],
                      ] as const
                    ).map(([value, label]) => (
                      <Button
                        key={value}
                        size="sm"
                        variant={el.ovaryIotaType === value ? "default" : "outline"}
                        onClick={() => el.setOvaryIotaType(value)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}

              {el.fields.map((f) => (
                <div key={f.key}>
                  <label className="mb-1 block text-sm font-medium">
                    {f.label}
                    {f.unit ? ` (${f.unit})` : ""}
                    {f.optional ? " · необяз." : ""}
                  </label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step={f.step ?? 0.1}
                    min={f.min}
                    max={f.max}
                    value={el.values[f.key] ?? ""}
                    onChange={(e) => el.setField(f.key, e.target.value)}
                  />
                  <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">
                    Допустимо: {f.min}–{f.max}
                  </p>
                </div>
              ))}

              {el.validationErrors.length ? (
                <ul className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                  {el.validationErrors.map((msg) => (
                    <li key={msg}>{msg}</li>
                  ))}
                </ul>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-2">
                <Button onClick={el.calculate}>Рассчитать</Button>
                <Button variant="ghost" onClick={el.goBack}>
                  ← Назад
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {el.step === "result" && el.result && el.organ ? (
          <Card className="overflow-hidden" style={{ borderColor: el.result.colorHex, borderWidth: 2 }}>
            <CardHeader>
              <Badge className="w-fit text-white" style={{ backgroundColor: el.result.colorHex }}>
                {riskLabel(el.result.riskCategory)}
              </Badge>
              <CardTitle className="text-2xl" style={{ color: el.result.colorHex }}>
                {el.result.value.toFixed(2)}
              </CardTitle>
              <CardDescription>{ORGAN_LABELS[el.organ]}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex h-3 overflow-hidden rounded-full">
                <div className="flex-1" style={{ backgroundColor: RISK_COLORS.low }} />
                <div className="flex-1" style={{ backgroundColor: RISK_COLORS.intermediate }} />
                <div className="flex-1" style={{ backgroundColor: RISK_COLORS.high }} />
              </div>
              <p className="font-semibold leading-relaxed text-slate-900 dark:text-slate-100">{el.result.conclusion}</p>
              <p className="text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">{el.result.recommendation}</p>
              {el.result.integrationHints?.biradsHint ? (
                <p className="text-sm font-medium text-violet-700 dark:text-violet-300">BI-RADS: {el.result.integrationHints.biradsHint}</p>
              ) : null}
              {el.result.integrationHints?.oradsHint ? (
                <p className="text-sm font-medium text-violet-700 dark:text-violet-300">O-RADS: {el.result.integrationHints.oradsHint}</p>
              ) : null}
              <p className="rounded-lg bg-amber-50 p-3 text-xs italic text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                {ELASTO_DISCLAIMER}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button disabled={pending} onClick={onSave}>
                  {pending ? "Сохранение…" : "Сохранить в историю"}
                </Button>
                <Button variant="secondary" onClick={el.goBack}>
                  Изменить ввод
                </Button>
                <Button variant="ghost" onClick={el.reset}>
                  Новый расчёт
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
