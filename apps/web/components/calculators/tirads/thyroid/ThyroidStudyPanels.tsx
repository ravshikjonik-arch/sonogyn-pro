"use client";

import {
  ACR_TIRADS_SOURCE,
  COMPOSITION_OPTIONS,
  ECHOGENIC_FOCI_OPTIONS,
  ECHOGENICITY_OPTIONS,
  EU_CATEGORY_META,
  EU_FNA_THRESHOLD_MM,
  EU_SOURCES,
  MARGIN_OPTIONS,
  SHAPE_OPTIONS,
  TIRADS_CATEGORIES,
  type ThyroidReport,
  type ThyroidStudyEvaluation,
  type ThyroidStudyInput,
} from "@repo/tirads-acr";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

const FNA_SHORT: Record<string, string> = {
  indicated: "показана",
  consider: "рассмотреть",
  not_indicated: "не показана",
  undetermined: "не определено",
};

export function ThyroidComparisonTable({ study, evaluation }: { study: ThyroidStudyInput; evaluation: ThyroidStudyEvaluation }) {
  return (
    <section className="space-y-2 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4">
      <h3 className="text-sm font-black text-[var(--clinical-foreground)]">Сравнение EU-TIRADS и ACR TI-RADS</h3>
      <p className="text-xs text-[var(--clinical-foreground-muted)]">
        Системы считаются независимо, у них разные критерии и пороги. Результат одной не влияет на другую.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="text-xs text-[var(--clinical-foreground-muted)]">
            <tr>
              <th className="py-2 pr-3 font-semibold">Узел</th>
              <th className="py-2 pr-3 font-semibold">EU-TIRADS</th>
              <th className="py-2 pr-3 font-semibold">ТАБ (EU)</th>
              <th className="py-2 pr-3 font-semibold">ACR</th>
              <th className="py-2 pr-3 font-semibold">FNA (ACR)</th>
            </tr>
          </thead>
          <tbody>
            {evaluation.comparison.map((row, i) => (
              <tr key={row.noduleId} className="border-t border-[var(--clinical-border)] align-top">
                <td className="py-2 pr-3 font-semibold">Узел {i + 1}</td>
                <td className="py-2 pr-3">{row.euCategory ? `EU-TIRADS ${row.euCategory}` : "—"}</td>
                <td className="py-2 pr-3">{row.euFna ? FNA_SHORT[row.euFna] : "—"}</td>
                <td className="py-2 pr-3">{row.acrCategory ?? "—"}</td>
                <td className="py-2 pr-3">
                  {row.acrFna ? FNA_SHORT[row.acrFna] : "—"}
                  {row.noteRu ? <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">{row.noteRu}</p> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-[var(--clinical-foreground-muted)]">
        Профиль EU-TIRADS: {study.euProfile === "RU_KR_2024" ? "КР 2024" : "ETA 2023"}.
      </p>
    </section>
  );
}

export function ThyroidReportPanel({ report }: { report: ThyroidReport }) {
  const fullText = [
    report.descriptionRu,
    "",
    "Заключение:",
    report.conclusionRu,
    report.tacticsRu ? `\nТактика:\n${report.tacticsRu}` : "",
    report.warningsRu.length ? `\nВнимание:\n${report.warningsRu.join("\n")}` : "",
    "",
    report.disclaimerRu,
  ]
    .filter((s) => s !== undefined)
    .join("\n");

  function copy() {
    void navigator.clipboard.writeText(fullText).then(() => toast.success("Заключение скопировано"));
  }

  return (
    <section className="space-y-3 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4" data-e2e-thyroid-report>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-black text-[var(--clinical-foreground)]">Описание и заключение УЗИ</h3>
        <Button type="button" size="sm" variant="outline" onClick={copy}>
          <Copy className="mr-1 h-3.5 w-3.5" aria-hidden />
          Скопировать
        </Button>
      </div>
      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--clinical-foreground)]">{report.descriptionRu}</pre>
      <div>
        <p className="text-xs font-bold uppercase text-[var(--clinical-foreground-muted)]">Заключение</p>
        <pre className="whitespace-pre-wrap font-sans text-sm font-semibold leading-relaxed text-[var(--clinical-foreground)]">{report.conclusionRu}</pre>
      </div>
      {report.tacticsRu ? (
        <div>
          <p className="text-xs font-bold uppercase text-[var(--clinical-foreground-muted)]">Тактика</p>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[var(--clinical-foreground)]">{report.tacticsRu}</pre>
        </div>
      ) : null}
      {report.sourcesRu.length ? (
        <details className="text-xs text-[var(--clinical-foreground-muted)]">
          <summary className="cursor-pointer font-semibold">Источники</summary>
          <ul className="mt-1 list-inside list-disc space-y-1">
            {report.sourcesRu.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </details>
      ) : null}
      <p className="text-xs text-[var(--clinical-foreground-muted)]">{report.disclaimerRu}</p>
    </section>
  );
}

function PointsTable({ title, options }: { title: string; options: { labelRu: string; points: number }[] }) {
  return (
    <div>
      <p className="text-xs font-bold text-[var(--clinical-foreground)]">{title}</p>
      <ul className="mt-1 space-y-0.5 text-xs text-[var(--clinical-foreground-muted)]">
        {options.map((o) => (
          <li key={o.labelRu} className="flex justify-between gap-3">
            <span>{o.labelRu}</span>
            <span className="font-bold text-[var(--clinical-foreground)]">{o.points}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ThyroidReferencePanel() {
  return (
    <div className="space-y-4">
      <section className="space-y-2 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4">
        <h3 className="text-sm font-black text-[var(--clinical-foreground)]">EU-TIRADS / ETA 2023</h3>
        <ul className="space-y-1 text-sm">
          {([1, 2, 3, 4, 5] as const).map((c) => (
            <li key={c} className="flex justify-between gap-3">
              <span>{EU_CATEGORY_META[c].labelRu}</span>
              <span className="font-semibold">риск {EU_CATEGORY_META[c].malignancyRiskRu}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          Признаки высокой подозрительности (достаточно одного): неовальная форма, неровные контуры, микрокальцинаты, выраженная гипоэхогенность.
        </p>
        <p className="text-xs text-[var(--clinical-foreground)]">
          ТАБ: EU-TIRADS 3 — более {EU_FNA_THRESHOLD_MM[3]} мм, EU-TIRADS 4 — более {EU_FNA_THRESHOLD_MM[4]} мм, EU-TIRADS 5 — более {EU_FNA_THRESHOLD_MM[5]} мм (КР 2024 и ETA 2023).
        </p>
        <ul className="list-inside list-disc text-[11px] text-[var(--clinical-foreground-muted)]">
          <li>{EU_SOURCES.EU_TIRADS_2017.citation}</li>
          <li>{EU_SOURCES.ETA_2023.citation}</li>
          <li>{EU_SOURCES.RU_KR_2024.citation}</li>
        </ul>
      </section>
      <section className="space-y-3 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4">
        <h3 className="text-sm font-black text-[var(--clinical-foreground)]">ACR TI-RADS 2017 · баллы</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <PointsTable title="Состав" options={COMPOSITION_OPTIONS.filter((o) => o.value !== "no_nodule")} />
          <PointsTable title="Эхогенность" options={ECHOGENICITY_OPTIONS} />
          <PointsTable title="Форма" options={SHAPE_OPTIONS} />
          <PointsTable title="Контуры" options={MARGIN_OPTIONS} />
          <PointsTable title="Эхогенные включения (суммируются)" options={ECHOGENIC_FOCI_OPTIONS} />
        </div>
        <ul className="space-y-1 text-sm">
          {TIRADS_CATEGORIES.map((c) => (
            <li key={c.code} className="flex justify-between gap-3">
              <span>{c.label}</span>
              <span className="text-xs text-[var(--clinical-foreground-muted)]">{c.pointsRange}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-[var(--clinical-foreground)]">
          FNA: TR3 ≥25 мм, TR4 ≥15 мм, TR5 ≥10 мм. Наблюдение: TR3 ≥15 мм (1, 3, 5 лет), TR4 ≥10 мм (1, 2, 3, 5 лет), TR5 ≥5 мм (ежегодно до 5 лет).
        </p>
        <p className="text-[11px] text-[var(--clinical-foreground-muted)]">{ACR_TIRADS_SOURCE.citation}</p>
      </section>
    </div>
  );
}
