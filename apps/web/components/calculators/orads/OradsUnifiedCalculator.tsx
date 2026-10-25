"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { Clipboard, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { CDSS_SHORT_DISCLAIMER } from "@repo/clinical-tools";
import {
  evaluateOradsUs2022,
  initialOradsUs2022Input,
  mapProInputToUs2022,
  ORADS_US2022_META,
  type ClassicTypeUs2022,
  type ColorScoreUs2022,
  type MenopauseUs2022,
  type MorphologyUs2022,
  type OradsUs2022Input,
} from "@repo/orads-us/pro";

import { saveCalculatorEntry } from "@/app/actions/calculator-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseOradsText } from "@/lib/orads-pro/text-parser";
import { cn } from "@/lib/utils/cn";
import { OradsReferoSection } from "@/components/calculators/orads/OradsReferoSection";
import { OradsUnifiedProtocolPreview } from "@/components/calculators/orads/OradsUnifiedProtocolPreview";

const selectClass =
  "mt-1 w-full rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-2.5 py-2 text-sm text-[var(--clinical-foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]";

const MORPHOLOGY: Array<{ value: MorphologyUs2022; title: string; subtitle: string }> = [
  { value: "normal", title: "Норма / физиология", subtitle: "Без focal образования" },
  { value: "classic", title: "Classic benign", subtitle: "Дермоид, эндометриома…" },
  { value: "unilocular", title: "Однокамерная", subtitle: "Unilocular" },
  { value: "bilocular", title: "Двухкамерная", subtitle: "Bilocular" },
  { value: "multilocular", title: "Многокамерная", subtitle: "Multilocular + CS" },
  { value: "solid", title: "Солидное", subtitle: "≥80% солидного" },
];

function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-sm font-medium text-[var(--clinical-foreground)]">{children}</span>;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-2.5 text-left text-sm transition-[border-color,background-color]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]",
        active
          ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary)]/8 font-semibold ring-1 ring-[var(--clinical-primary)]/25"
          : "border-[var(--clinical-border)] bg-[var(--clinical-card)] hover:border-[var(--clinical-primary)]/35",
      )}
    >
      {children}
    </button>
  );
}

/** Единый калькулятор O-RADS US v2022 (ACR стратификация 0–5). */
export function OradsUnifiedCalculator() {
  const [input, setInput] = useState<OradsUs2022Input>(initialOradsUs2022Input);
  const [textDraft, setTextDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const [mobilePane, setMobilePane] = useState<"edit" | "preview">("edit");

  const result = useMemo(() => evaluateOradsUs2022(input), [input]);

  const isCyst = ["unilocular", "bilocular", "multilocular"].includes(input.morphology);
  const needsSize =
    isCyst ||
    input.morphology === "solid" ||
    (input.morphology === "classic" &&
      ["dermoid", "endometrioma", "hemorrhagic"].includes(input.classicType));
  const needsMenopause =
    (input.morphology === "unilocular" &&
      !input.solidComponent &&
      input.innerContour === "smooth") ||
    input.classicType === "hemorrhagic" ||
    input.classicType === "endometrioma";
  const needsColor =
    input.morphology === "solid" ||
    (input.morphology === "multilocular" && !input.solidComponent && input.innerContour === "smooth") ||
    (isCyst && input.solidComponent && input.morphology !== "unilocular");

  function set<K extends keyof OradsUs2022Input>(key: K, value: OradsUs2022Input[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  function reset() {
    setInput(initialOradsUs2022Input);
    setTextDraft("");
  }

  function applyFromText() {
    const parsed = parseOradsText(textDraft);
    const mapped = mapProInputToUs2022(parsed.input);
    if (!mapped) {
      toast.error("Не удалось сопоставить текст с полями O-RADS — заполните форму вручную");
      return;
    }
    setInput({ ...initialOradsUs2022Input, ...mapped });
    toast.success("Признаки из текста подставлены — проверьте форму");
  }

  function onSave() {
    if (result.category === null) {
      toast.error("Категория не определена — заполните обязательные поля");
      return;
    }
    startTransition(() => {
      void saveCalculatorEntry({
        slug: "o-rads",
        calculatorCode: "O_RADS",
        payload: { input, result },
        summary: `O-RADS ${result.category} · ${result.risk}`,
      }).then((res) => {
        if (res.ok) toast.success("Сохранено в истории калькуляторов");
        else toast.error(res.message);
      });
    });
  }

  const displayCategory = result.category;
  const meta = displayCategory !== null ? ORADS_US2022_META[displayCategory] : null;

  const cycleLine =
    input.menopause === "pre" && input.cycleRegularity
      ? `Цикл: ${input.cycleRegularity === "regular" ? "регулярный" : "нерегулярный"}`
      : null;

  const reportPlain = [
    `O-RADS US v2022 · SonoGyn Pro`,
    displayCategory === null
      ? `Категория: не определена`
      : `O-RADS ${displayCategory} · ${meta?.title ?? ""} · ROM ${result.risk}`,
    cycleLine,
    `Обоснование: ${result.rationale}`,
    `Тактика: ${result.management}`,
    result.warning ? `Примечание: ${result.warning}` : null,
    "",
    CDSS_SHORT_DISCLAIMER,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-32 lg:px-8" data-e2e-orads-unified>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--clinical-foreground)]">
            Стратификация O-RADS US
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
            Категории 0–5, ROM и тактика по ACR v2022. При нескольких образованиях — отдельная оценка каждого; ведение
            по наивысшей категории.
          </p>
        </div>
        <div className="hidden flex-wrap gap-2 lg:flex">
          <ActionBar pending={pending} onReset={reset} onSave={onSave} reportPlain={reportPlain} />
        </div>
      </header>

      <div
        className="mt-4 flex gap-1 rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/50 p-1 lg:hidden"
        role="tablist"
        aria-label="Редактор и превью"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mobilePane === "edit"}
          className={cn(
            "flex-1 rounded-md px-3 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]",
            mobilePane === "edit"
              ? "bg-[var(--clinical-card)] text-[var(--clinical-foreground)] shadow-sm"
              : "text-[var(--clinical-foreground-muted)]",
          )}
          onClick={() => setMobilePane("edit")}
        >
          Признаки
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mobilePane === "preview"}
          className={cn(
            "flex-1 rounded-md px-3 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]",
            mobilePane === "preview"
              ? "bg-[var(--clinical-card)] text-[var(--clinical-foreground)] shadow-sm"
              : "text-[var(--clinical-foreground-muted)]",
          )}
          onClick={() => setMobilePane("preview")}
        >
          Превью
        </button>
      </div>

      <div className="mt-4 rounded-2xl bg-[var(--clinical-muted)]/40 p-3 sm:p-4 lg:mt-8">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start lg:gap-6">
          <div className={cn("min-w-0 space-y-3", mobilePane === "preview" && "hidden lg:block")}>
            <OradsReferoSection title="Из текста протокола" defaultOpen={false}>
              <textarea
                value={textDraft}
                onChange={(e) => setTextDraft(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/30 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]"
                placeholder="Фрагмент описания УЗИ без ФИО…"
              />
              <Button type="button" size="sm" variant="secondary" onClick={applyFromText}>
                Подставить признаки
              </Button>
            </OradsReferoSection>

            <OradsReferoSection title="Морфология по лексикону ACR" defaultOpen>
        <div className="grid gap-2 sm:grid-cols-2">
          {MORPHOLOGY.map((m) => (
            <Chip
              key={m.value}
              active={input.morphology === m.value}
              onClick={() =>
                setInput((prev) => ({
                  ...initialOradsUs2022Input,
                  menopause: prev.menopause,
                  cycleRegularity: prev.cycleRegularity,
                  morphology: m.value,
                }))
              }
            >
              <span className="block font-semibold">{m.title}</span>
              <span className="text-xs text-[var(--clinical-foreground-muted)]">{m.subtitle}</span>
            </Chip>
          ))}
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-dashed border-[var(--clinical-border)] p-3">
          <input
            type="checkbox"
            checked={input.incomplete}
            onChange={(e) => set("incomplete", e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm">
            <strong>Технически неполное исследование</strong>
            <span className="block text-xs text-[var(--clinical-foreground-muted)]">→ O-RADS 0</span>
          </span>
        </label>
            </OradsReferoSection>

            {input.morphology && !input.incomplete ? (
              <OradsReferoSection title="Признаки образования" defaultOpen>
          <div className="grid gap-4 sm:grid-cols-2">
            {input.morphology === "classic" ? (
              <label className="block text-sm">
                <FieldLabel>Classic benign</FieldLabel>
                <select
                  className={selectClass}
                  value={input.classicType}
                  onChange={(e) => set("classicType", e.target.value as ClassicTypeUs2022)}
                >
                  <option value="">Выберите тип</option>
                  <option value="dermoid">Дермоид</option>
                  <option value="endometrioma">Эндометриома</option>
                  <option value="hemorrhagic">Геморрагическая</option>
                  <option value="paraovarian">Параовариальная</option>
                  <option value="peritoneal">Перитонеальная инклюзия</option>
                  <option value="hydrosalpinx">Гидросальпинкс</option>
                </select>
              </label>
            ) : null}

            {needsMenopause ? (
              <div className="space-y-3 sm:col-span-2">
                <p className="text-sm font-medium leading-snug text-[var(--clinical-foreground)]">
                  Менопауза / пременопауза · цикл регулярный / нерегулярный (O-RADS US v2022)
                </p>
                <label className="block text-sm">
                  <FieldLabel>Статус</FieldLabel>
                  <select
                    className={selectClass}
                    value={input.menopause}
                    onChange={(e) => {
                      const next = e.target.value as MenopauseUs2022;
                      setInput((prev) => ({
                        ...prev,
                        menopause: next,
                        cycleRegularity: next === "pre" ? prev.cycleRegularity : "",
                      }));
                    }}
                  >
                    <option value="">Выберите</option>
                    <option value="pre">Пременопауза</option>
                    <option value="postEarly">Постменопауза &lt; 5 лет</option>
                    <option value="postLate">Постменопауза ≥ 5 лет</option>
                  </select>
                </label>
                {input.menopause === "pre" ? (
                  <label className="block text-sm">
                    <FieldLabel>Менструальный цикл</FieldLabel>
                    <select
                      className={selectClass}
                      value={input.cycleRegularity}
                      onChange={(e) =>
                        set("cycleRegularity", e.target.value as OradsUs2022Input["cycleRegularity"])
                      }
                    >
                      <option value="">Не указано</option>
                      <option value="regular">Регулярный</option>
                      <option value="irregular">Нерегулярный</option>
                    </select>
                  </label>
                ) : null}
              </div>
            ) : null}

            {needsSize ? (
              <label className="block text-sm">
                <FieldLabel>Макс. диаметр, см</FieldLabel>
                <Input
                  type="number"
                  min={0.1}
                  step={0.1}
                  className="mt-1"
                  value={input.sizeCm ?? ""}
                  onChange={(e) =>
                    set("sizeCm", e.target.value === "" ? null : Number.parseFloat(e.target.value))
                  }
                />
              </label>
            ) : null}

            {input.morphology === "unilocular" && !input.solidComponent ? (
              <label className="block text-sm">
                <FieldLabel>Содержимое</FieldLabel>
                <select
                  className={selectClass}
                  value={input.cystContent}
                  onChange={(e) => set("cystContent", e.target.value as "simple" | "nonSimple")}
                >
                  <option value="simple">Простое (анэхогенное)</option>
                  <option value="nonSimple">Непростое</option>
                </select>
              </label>
            ) : null}

            {isCyst ? (
              <label className="block text-sm">
                <FieldLabel>Солидный компонент ≥3 мм</FieldLabel>
                <select
                  className={selectClass}
                  value={String(input.solidComponent)}
                  onChange={(e) => set("solidComponent", e.target.value === "true")}
                >
                  <option value="false">Нет</option>
                  <option value="true">Да</option>
                </select>
              </label>
            ) : null}

            {isCyst && !input.solidComponent ? (
              <label className="block text-sm">
                <FieldLabel>Внутренний контур</FieldLabel>
                <select
                  className={selectClass}
                  value={input.innerContour}
                  onChange={(e) => set("innerContour", e.target.value as "smooth" | "irregular")}
                >
                  <option value="smooth">Ровный</option>
                  <option value="irregular">Неровный</option>
                </select>
              </label>
            ) : null}

            {input.morphology === "unilocular" && input.solidComponent ? (
              <label className="block text-sm">
                <FieldLabel>Папиллярные разрастания</FieldLabel>
                <select
                  className={selectClass}
                  value={input.papillae}
                  onChange={(e) => set("papillae", e.target.value as OradsUs2022Input["papillae"])}
                >
                  <option value="0">Нет (только solid)</option>
                  <option value="1-3">1–3</option>
                  <option value="4+">≥4</option>
                </select>
              </label>
            ) : null}

            {input.morphology === "solid" ? (
              <label className="block text-sm">
                <FieldLabel>Наружный контур</FieldLabel>
                <select
                  className={selectClass}
                  value={input.outerContour}
                  onChange={(e) => set("outerContour", e.target.value as "smooth" | "irregular")}
                >
                  <option value="smooth">Ровный</option>
                  <option value="irregular">Неровный</option>
                </select>
              </label>
            ) : null}

            {needsColor ? (
              <label className="block text-sm">
                <FieldLabel>Цветовой балл IOTA (worst lesion)</FieldLabel>
                <select
                  className={selectClass}
                  value={input.colorScore ?? ""}
                  onChange={(e) =>
                    set(
                      "colorScore",
                      e.target.value === "" ? null : (Number(e.target.value) as ColorScoreUs2022),
                    )
                  }
                >
                  <option value="">Выберите</option>
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            {input.morphology === "solid" ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={input.shadowing}
                  onChange={(e) => set("shadowing", e.target.checked)}
                />
                Акустическая тень
              </label>
            ) : null}

            {input.morphology !== "classic" ? (
              <label className="block text-sm">
                <FieldLabel>Доп. признаки</FieldLabel>
                <select
                  className={selectClass}
                  value={input.extraSigns}
                  onChange={(e) => set("extraSigns", e.target.value as OradsUs2022Input["extraSigns"])}
                >
                  <option value="none">Нет</option>
                  <option value="ascites">Асцит</option>
                  <option value="peritoneal">Узелки брюшины</option>
                </select>
              </label>
            ) : null}
          </div>
              </OradsReferoSection>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-1 lg:hidden">
              <ActionBar pending={pending} onReset={reset} onSave={onSave} reportPlain={reportPlain} />
            </div>
          </div>

          <aside
            className={cn(
              "space-y-3 lg:sticky lg:top-24",
              mobilePane === "edit" && "hidden lg:block",
            )}
          >
            <OradsUnifiedProtocolPreview input={input} result={result} />
            <div className="flex flex-wrap gap-2 text-sm">
              <Button type="button" variant="ghost" size="sm" asChild className="h-8 px-2">
                <Link href="/tools/calc/rads/iota">IOTA</Link>
              </Button>
              <Button type="button" variant="ghost" size="sm" asChild className="h-8 px-2">
                <Link href="/tools/refs/orads-echograms">Эхограммы</Link>
              </Button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ActionBar({
  pending,
  onReset,
  onSave,
  reportPlain,
}: {
  pending: boolean;
  onReset: () => void;
  onSave: () => void;
  reportPlain: string;
}) {
  return (
    <>
      <Button type="button" variant="secondary" size="sm" onClick={onReset}>
        <RotateCcw className="mr-1 h-4 w-4" aria-hidden />
        Сброс
      </Button>
      <Button type="button" size="sm" disabled={pending} onClick={onSave}>
        Сохранить
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-label="Копировать текст стратификации в протокол"
        onClick={() => void navigator.clipboard.writeText(reportPlain).then(() => toast.success("Скопировано"))}
      >
        <Clipboard className="mr-1 h-4 w-4" aria-hidden />
        В протокол
      </Button>
    </>
  );
}
