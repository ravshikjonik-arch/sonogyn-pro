"use client";

import {
  AMBULATORY_INTAKE_DISCLAIMER,
  AMBULATORY_INTAKE_ROUTE,
  AMBULATORY_INTAKE_STORAGE_KEY,
  AMBULATORY_PRODUCT_SUBTITLE,
  AMBULATORY_PRODUCT_TITLE,
  AmbulatoryIntakeDraftSchema,
  CHART_FIELD_IDS,
  CHART_FIELD_LABELS,
  CLINICAL_SCENARIOS,
  DEFAULT_REGION,
  REGION_PROFILES,
  REGULATORY_STATUS_LABELS,
  VISIT_REASONS,
  buildChartNoteDraft,
  buildDynamicChecklist,
  countMarkedItems,
  createDraftForReasons,
  createEmptyDraft,
  filterImportant,
  getPinnedEssentials,
  getRegionProfile,
  labsForReasons,
  listRegulatoryForRegion,
  scenariosForReasons,
  searchRegulatoryNaturalLanguage,
  type AmbulatoryIntakeDraft,
  type ChartFieldId,
  type DynamicItem,
  type ItemStatus,
  type RegionCode,
  type VisitReasonId,
  type VisitView,
} from "@repo/ambulatory-intake";
import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronRight,
  Circle,
  ClipboardList,
  Copy,
  Eye,
  Flag,
  Microscope,
  RotateCcw,
  Search,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

function loadDraft(): AmbulatoryIntakeDraft {
  if (typeof window === "undefined") return createEmptyDraft();
  try {
    const raw = window.localStorage.getItem(AMBULATORY_INTAKE_STORAGE_KEY);
    if (!raw) return createEmptyDraft();
    const parsed = AmbulatoryIntakeDraftSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : createEmptyDraft();
  } catch {
    return createEmptyDraft();
  }
}

function persist(draft: AmbulatoryIntakeDraft) {
  window.localStorage.setItem(AMBULATORY_INTAKE_STORAGE_KEY, JSON.stringify(draft));
}

function cycleStatus(current: ItemStatus): ItemStatus {
  if (current === "empty") return "done";
  if (current === "done") return "not_indicated";
  return "empty";
}

function StatusMark({ status }: { status: ItemStatus }) {
  if (status === "done") return <Check className="h-4 w-4 text-[var(--clinical-primary)]" aria-hidden />;
  if (status === "not_indicated")
    return <span className="text-[10px] font-bold uppercase text-[var(--clinical-foreground-muted)]">н/п</span>;
  return <Circle className="h-4 w-4 text-[var(--clinical-foreground-muted)]" aria-hidden />;
}

function Shell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "relative min-h-[calc(100dvh-4rem)] overflow-hidden",
        "bg-[var(--clinical-canvas)] text-[var(--clinical-foreground)]",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(900px 420px at 12% -8%, color-mix(in srgb, var(--clinical-primary) 22%, transparent), transparent 60%), radial-gradient(700px 380px at 92% 8%, color-mix(in srgb, var(--clinical-accent-teal, #14b8a6) 18%, transparent), transparent 55%), linear-gradient(180deg, color-mix(in srgb, var(--clinical-muted) 55%, transparent), transparent 42%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--clinical-primary)]/40 to-transparent"
      />
      <div className="relative">{children}</div>
    </div>
  );
}

export function AmbulatoryVisitClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [draft, setDraft] = useState<AmbulatoryIntakeDraft>(() => createEmptyDraft());
  const [hydrated, setHydrated] = useState(false);
  const [labQuery, setLabQuery] = useState("");
  const [regQuery, setRegQuery] = useState("");
  const [showRedFlags, setShowRedFlags] = useState(false);

  useEffect(() => {
    const loaded = loadDraft();
    const viewParam = searchParams.get("view") as VisitView | null;
    if (viewParam && ["hub", "checklist", "scenarios", "regulatory", "summary"].includes(viewParam)) {
      loaded.view = viewParam;
    }
    setDraft(loaded);
    setHydrated(true);
  }, [searchParams]);

  const update = useCallback((next: AmbulatoryIntakeDraft) => {
    const withTs = { ...next, updatedAt: new Date().toISOString(), version: 2 as const };
    setDraft(withTs);
    persist(withTs);
  }, []);

  const setView = useCallback(
    (view: VisitView) => {
      update({ ...draft, view });
      router.replace(`${AMBULATORY_INTAKE_ROUTE}?view=${view}`, { scroll: false });
    },
    [draft, router, update],
  );

  const startWithReasons = useCallback(
    (reasonIds: VisitReasonId[]) => {
      const next = createDraftForReasons(reasonIds);
      next.regionCode = draft.regionCode || DEFAULT_REGION;
      update(next);
      router.replace(`${AMBULATORY_INTAKE_ROUTE}?view=checklist`, { scroll: false });
    },
    [draft.regionCode, router, update],
  );

  const reasonIds = draft.reasonIds as VisitReasonId[];
  const effectiveReasons = useMemo(
    () => (reasonIds.length ? reasonIds : (["primary"] as VisitReasonId[])),
    [reasonIds],
  );
  const sections = useMemo(() => {
    const raw = buildDynamicChecklist(effectiveReasons);
    return draft.importantOnly ? filterImportant(raw) : raw;
  }, [effectiveReasons, draft.importantOnly]);

  const pinned = useMemo(() => getPinnedEssentials(effectiveReasons), [effectiveReasons]);
  const labs = useMemo(() => labsForReasons(effectiveReasons), [effectiveReasons]);
  const scenarios = useMemo(() => scenariosForReasons(reasonIds), [reasonIds]);
  const region = getRegionProfile(draft.regionCode);
  const regulatory = listRegulatoryForRegion(draft.regionCode);
  const regHits = useMemo(
    () => (regQuery.trim() ? searchRegulatoryNaturalLanguage(regQuery, draft.regionCode) : []),
    [regQuery, draft.regionCode],
  );
  const counts = useMemo(() => countMarkedItems(draft), [draft]);
  const noteText = useMemo(() => buildChartNoteDraft(draft), [draft]);

  const pinnedProgress = useMemo(() => {
    let done = 0;
    for (const item of pinned) {
      const s = draft.itemStates[item.id]?.status;
      if (s === "done" || s === "not_indicated") done += 1;
    }
    return { done, total: pinned.length };
  }, [pinned, draft.itemStates]);

  const filteredLabs = useMemo(() => {
    const q = labQuery.trim().toLowerCase();
    const filter = <T extends { labelRu: string }>(list: T[]) =>
      q ? list.filter((i) => i.labelRu.toLowerCase().includes(q)) : list;
    return {
      route: filter(labs.route),
      clinical: filter(labs.clinical),
      notRoutine: filter(labs.notRoutine),
    };
  }, [labs, labQuery]);

  const redFlagItems = useMemo(() => {
    return scenarios.flatMap((s) => s.redFlags.map((f) => ({ scenario: s.titleRu, text: f })));
  }, [scenarios]);

  const setItem = (id: string, status: ItemStatus, note?: string) => {
    const prev = draft.itemStates[id];
    update({
      ...draft,
      itemStates: { ...draft.itemStates, [id]: { status, note: note ?? prev?.note } },
    });
  };

  const setLab = (id: string, status: ItemStatus) => {
    update({
      ...draft,
      labStates: { ...draft.labStates, [id]: { status } },
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(noteText);
      toast.success("Черновик скопирован");
    } catch {
      toast.error("Не удалось скопировать");
    }
  };

  const handleReset = () => {
    if (!window.confirm("Сбросить локальный черновик?")) return;
    const empty = createEmptyDraft();
    empty.regionCode = draft.regionCode;
    update(empty);
    router.replace(AMBULATORY_INTAKE_ROUTE, { scroll: false });
    toast.message("Черновик очищен");
  };

  const evidenceHref = (q: string) =>
    `/tools/refs/evidence-assistant?q=${encodeURIComponent(q)}&corpus=rf_kr`;

  /* ——— HUB ——— */
  if (!hydrated || draft.view === "hub") {
    return (
      <Shell>
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-28">
          <header className="space-y-3">
            <Link href="/tools/calc/appointment" className="text-sm text-[var(--clinical-foreground-muted)]">
              ← Приём · быстрые
            </Link>
            <div className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)]/85 p-5 shadow-[var(--clinical-card-shadow,0_8px_30px_rgba(0,0,0,.08))] backdrop-blur-sm">
              <p className="text-xs font-semibold tracking-wide text-[var(--clinical-primary-deep)]">
                SonoGyn Pro · врач первичного звена
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{AMBULATORY_PRODUCT_TITLE}</h1>
              <p className="mt-2 max-w-prose text-sm text-[var(--clinical-foreground-muted)]">
                {AMBULATORY_PRODUCT_SUBTITLE}. На приёме: жалобы → осмотр в зеркалах → цитология / ВПЧ → план. Без ФИО и
                ПДн · {region.labelRu}.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { icon: Eye, label: "Зеркала" },
                  { icon: Microscope, label: "Цитология" },
                  { icon: Stethoscope, label: "ВПЧ" },
                  { icon: Flag, label: "Красные флаги" },
                ].map((chip) => (
                  <span
                    key={chip.label}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-surface)] px-2.5 py-1 text-xs font-medium"
                  >
                    <chip.icon className="h-3.5 w-3.5 text-[var(--clinical-primary)]" aria-hidden />
                    {chip.label}
                  </span>
                ))}
              </div>
            </div>
          </header>

          <label className="block space-y-1 text-sm">
            <span className="text-xs font-semibold text-[var(--clinical-foreground-muted)]">Регион нормативных слоёв</span>
            <select
              className="w-full rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 py-2"
              value={draft.regionCode}
              onChange={(e) => update({ ...draft, regionCode: e.target.value as RegionCode })}
              aria-label="Регион"
            >
              {REGION_PROFILES.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.labelRu}
                  {!r.libraryConfigured ? " — база не заполнена" : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-[var(--clinical-foreground-muted)]">{region.noteRu}</p>
          </label>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Старт приёма</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              <HubCard
                title="Первичный приём АГ"
                detail="Зеркала · цитология · ВПЧ · полный поток"
                onClick={() => startWithReasons(["primary"])}
                primary
                icon={ClipboardList}
              />
              <HubCard
                title="Скрининг шейки"
                detail="Осмотр + цитология / ВПЧ по алгоритму"
                onClick={() => startWithReasons(["cervix", "preventive"])}
                icon={Microscope}
              />
              <HubCard
                title="Профилактический осмотр"
                detail="Маршрут + кабинетный минимум"
                onClick={() => startWithReasons(["preventive"])}
                icon={Eye}
              />
              <HubCard title="Повторный приём" detail="Контроль и дообследование" onClick={() => startWithReasons(["followup"])} />
              <HubCard
                title="Диспансеризация / ДОРЗ"
                detail="Сверка возраста и периодичности"
                onClick={() => startWithReasons(["dispensarization"])}
              />
              <HubCard
                title="Клинические алгоритмы"
                detail={`${CLINICAL_SCENARIOS.length} сценариев`}
                onClick={() => setView("scenarios")}
                icon={BookOpen}
              />
              <HubCard title="Нормативная база" detail="747н · 404н · ДЗМ · КР" onClick={() => setView("regulatory")} />
              <HubCard
                title="КР в кабинете"
                detail="Рубрикатор / полки SonoGyn"
                onClick={() => router.push("/tools/refs/guidelines")}
              />
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-[var(--clinical-foreground-muted)]">Приём по жалобе</h2>
            <div className="flex flex-wrap gap-2">
              {VISIT_REASONS.filter((r) => r.hubGroup === "complaint").map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => startWithReasons([r.id])}
                  className="rounded-full border border-[var(--clinical-border)] bg-[var(--clinical-card)]/80 px-3 py-1.5 text-xs font-medium shadow-sm transition hover:border-[var(--clinical-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]"
                >
                  {r.labelRu}
                </button>
              ))}
            </div>
          </section>

          <p className="rounded-xl border border-dashed border-[var(--clinical-border)] bg-[var(--clinical-card)]/60 px-3 py-2 text-xs text-[var(--clinical-foreground-muted)]">
            {AMBULATORY_INTAKE_DISCLAIMER}
          </p>
        </div>
      </Shell>
    );
  }

  /* ——— REGULATORY ——— */
  if (draft.view === "regulatory") {
    return (
      <Shell>
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 pb-28">
          <TopBar onBack={() => setView("hub")} title="Нормативная база" />
          <label className="block space-y-1">
            <span className="text-xs font-semibold">Регион</span>
            <select
              className="w-full rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 py-2 text-sm"
              value={draft.regionCode}
              onChange={(e) => update({ ...draft, regionCode: e.target.value as RegionCode })}
            >
              {REGION_PROFILES.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.labelRu}
                </option>
              ))}
            </select>
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--clinical-foreground-muted)]" />
            <input
              value={regQuery}
              onChange={(e) => setRegQuery(e.target.value)}
              placeholder="Напр.: порядок диспансеризации для Санкт-Петербурга"
              className="w-full rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] py-2 pl-10 pr-3 text-sm"
            />
          </div>
          {regQuery.trim() && draft.regionCode === "RU-SPE" && !getRegionProfile("RU-SPE").libraryConfigured ? (
            <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs">
              Региональная база Санкт-Петербурга не заполнена (NOT_CONFIGURED). Федеральный слой доступен ниже; не
              подставляйте документы Москвы.
            </p>
          ) : null}
          {regHits.length > 0 ? (
            <DocList title="Результаты поиска" docs={regHits} />
          ) : (
            <>
              <DocList title="Федеральный слой" docs={regulatory.federal} />
              {regulatory.regionalConfigured ? (
                <DocList title={`Регион: ${region.labelRu}`} docs={regulatory.regional} />
              ) : (
                <p className="text-xs text-[var(--clinical-foreground-muted)]">
                  Региональный слой для {region.labelRu}: не настроен. Федеральные документы остаются без изменений.
                </p>
              )}
            </>
          )}
          <Link href="/tools/refs/guidelines" className="inline-flex items-center gap-1 text-sm text-[var(--clinical-primary)]">
            <BookOpen className="h-4 w-4" /> Каталог КР в кабинете
          </Link>
        </div>
      </Shell>
    );
  }

  /* ——— SCENARIOS ——— */
  if (draft.view === "scenarios") {
    const list = reasonIds.length ? scenarios : CLINICAL_SCENARIOS;
    return (
      <Shell>
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 pb-28">
          <TopBar onBack={() => setView("hub")} title="Клинические алгоритмы" />
          <div className="space-y-3">
            {list.map((s) => (
              <article
                key={s.id}
                className="rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)]/90 p-4 shadow-sm"
              >
                <h3 className="font-semibold">{s.titleRu}</h3>
                <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                  <div>
                    <p className="font-semibold text-[var(--clinical-foreground-muted)]">Осмотр</p>
                    <ul className="mt-1 list-inside list-disc text-[var(--clinical-foreground-muted)]">
                      {s.exam.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--clinical-foreground-muted)]">Дообследование</p>
                    <ul className="mt-1 list-inside list-disc text-[var(--clinical-foreground-muted)]">
                      {s.workupHints.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">Красные флаги</p>
                <ul className="mt-1 list-inside list-disc text-xs text-[var(--clinical-foreground-muted)]">
                  {s.redFlags.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-[var(--clinical-foreground-muted)]">{s.sourcesHintRu}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {s.tools.map((t) => (
                    <Link
                      key={t.href + t.title}
                      href={t.href}
                      className="rounded-lg border border-[var(--clinical-border)] px-2 py-1 text-xs font-medium"
                    >
                      {t.title}
                    </Link>
                  ))}
                  <Link
                    href={evidenceHref(s.evidenceQuery)}
                    className="inline-flex items-center gap-1 rounded-lg bg-[var(--clinical-primary)] px-2 py-1 text-xs font-medium text-white"
                  >
                    <Sparkles className="h-3 w-3" /> AI Evidence
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Shell>
    );
  }

  /* ——— SUMMARY ——— */
  if (draft.view === "summary") {
    return (
      <Shell>
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 pb-28">
          <TopBar onBack={() => setView("checklist")} title="Итог амбулаторного приёма" />
          <p className="text-xs text-[var(--clinical-foreground-muted)]">
            Черновик для копирования. Требует проверки врачом. Персональные данные не хранятся.
          </p>
          <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-3 text-xs leading-relaxed">
            {noteText}
          </pre>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => void handleCopy()}>
              <Copy className="mr-1.5 h-3.5 w-3.5" /> Скопировать
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href={evidenceHref("амбулаторный приём акушер гинеколог КР")}>
                <Sparkles className="mr-1.5 h-3.5 w-3.5" /> AI Evidence
              </Link>
            </Button>
            <Button type="button" variant="outline" onClick={() => setView("hub")}>
              На старт
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  /* ——— CHECKLIST ——— */
  return (
    <Shell>
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-6 pb-28 lg:grid lg:max-w-5xl lg:grid-cols-[200px_1fr] lg:gap-6">
        <nav className="hidden lg:sticky lg:top-24 lg:block lg:self-start lg:space-y-1" aria-label="Разделы">
          <a href="#sec-essentials" className="block rounded-lg px-2 py-1.5 text-xs font-semibold text-[var(--clinical-primary)] hover:bg-[var(--clinical-muted)]">
            Кабинетный минимум
          </a>
          {sections.map((s) => (
            <a key={s.id} href={`#sec-${s.id}`} className="block rounded-lg px-2 py-1.5 text-xs hover:bg-[var(--clinical-muted)]">
              {s.title}
            </a>
          ))}
          <a href="#sec-labs" className="block rounded-lg px-2 py-1.5 text-xs hover:bg-[var(--clinical-muted)]">
            4. Лаборатория
          </a>
        </nav>

        <div className="space-y-4">
          <header className="space-y-3 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)]/90 p-4 shadow-sm backdrop-blur-sm">
            <button type="button" onClick={() => setView("hub")} className="text-sm text-[var(--clinical-foreground-muted)]">
              ← {AMBULATORY_PRODUCT_TITLE}
            </button>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h1 className="text-xl font-semibold">{AMBULATORY_PRODUCT_TITLE}</h1>
                <p className="text-xs text-[var(--clinical-foreground-muted)]">
                  {region.labelRu} · отмечено {counts.done} · н/п {counts.notIndicated} · минимум {pinnedProgress.done}/
                  {pinnedProgress.total}
                </p>
              </div>
              <div
                className="h-2 w-28 overflow-hidden rounded-full bg-[var(--clinical-muted)]"
                role="progressbar"
                aria-valuenow={pinnedProgress.done}
                aria-valuemin={0}
                aria-valuemax={pinnedProgress.total}
                aria-label="Кабинетный минимум"
              >
                <div
                  className="h-full rounded-full bg-[var(--clinical-primary)] transition-[width]"
                  style={{
                    width: pinnedProgress.total
                      ? `${Math.round((pinnedProgress.done / pinnedProgress.total) * 100)}%`
                      : "0%",
                  }}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={draft.importantOnly ? "default" : "outline"}
                onClick={() => update({ ...draft, importantOnly: !draft.importantOnly })}
              >
                {draft.importantOnly ? "Показать все пункты" : "Только важное"}
              </Button>
              <Button type="button" size="sm" variant={showRedFlags ? "default" : "outline"} onClick={() => setShowRedFlags((v) => !v)}>
                <Flag className="mr-1 h-3.5 w-3.5" /> Красные флаги
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setView("scenarios")}>
                Рекомендации / алгоритмы
              </Button>
              <Button type="button" size="sm" variant="outline" asChild>
                <Link href={evidenceHref(scenarios[0]?.evidenceQuery ?? "амбулаторный приём АГ цитология ВПЧ")}>
                  <Sparkles className="mr-1 h-3.5 w-3.5" /> AI Evidence
                </Link>
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={handleReset}>
                <RotateCcw className="mr-1 h-3.5 w-3.5" /> Сброс
              </Button>
            </div>
          </header>

          {showRedFlags ? (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs">
              <p className="font-semibold text-red-700 dark:text-red-300">
                <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
                Красные флаги по выбранным сценариям
              </p>
              {redFlagItems.length === 0 ? (
                <p className="mt-1 text-[var(--clinical-foreground-muted)]">Выберите жалобу на старте — появятся флаги сценария.</p>
              ) : (
                <ul className="mt-1 list-inside list-disc">
                  {redFlagItems.map((f) => (
                    <li key={f.scenario + f.text}>
                      <span className="font-medium">{f.scenario}:</span> {f.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}

          <section
            id="sec-essentials"
            className="space-y-2 rounded-2xl border border-[var(--clinical-primary)]/35 bg-[color-mix(in_srgb,var(--clinical-primary)_8%,var(--clinical-card))] p-4"
          >
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-[var(--clinical-primary)]" aria-hidden />
              <h2 className="text-base font-semibold">Кабинетный минимум</h2>
            </div>
            <p className="text-xs text-[var(--clinical-foreground-muted)]">
              Зеркала, шейка, цитология, ВПЧ — тап: выполнено → н/п → снова пусто.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {pinned.map((item) => (
                <ChecklistRow
                  key={`pin-${item.id}`}
                  item={item}
                  status={draft.itemStates[item.id]?.status ?? "empty"}
                  note={draft.itemStates[item.id]?.note}
                  onCycle={() => setItem(item.id, cycleStatus(draft.itemStates[item.id]?.status ?? "empty"))}
                  onNote={(note) => setItem(item.id, draft.itemStates[item.id]?.status ?? "empty", note)}
                  emphasize
                />
              ))}
            </div>
          </section>

          {sections.map((section) => (
            <section key={section.id} id={`sec-${section.id}`} className="space-y-2">
              <h2 className="text-base font-semibold">{section.title}</h2>
              {section.hint ? <p className="text-xs text-[var(--clinical-foreground-muted)]">{section.hint}</p> : null}
              {section.items.map((item) => {
                const state = draft.itemStates[item.id];
                const status = state?.status ?? "empty";
                return (
                  <ChecklistRow
                    key={item.id}
                    item={item}
                    status={status}
                    note={state?.note}
                    onCycle={() => setItem(item.id, cycleStatus(status))}
                    onNote={(note) => setItem(item.id, status, note)}
                  />
                );
              })}
            </section>
          ))}

          <section id="sec-labs" className="space-y-3">
            <h2 className="text-base font-semibold">4. Лабораторная диагностика</h2>
            <p className="text-xs text-[var(--clinical-foreground-muted)]">
              А — по маршруту (цитология / ВПЧ здесь дублируют кабинетный минимум для назначения). Б — по показаниям. В —
              не рутинно.
            </p>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--clinical-foreground-muted)]" />
              <input
                value={labQuery}
                onChange={(e) => setLabQuery(e.target.value)}
                placeholder="Поиск: цитология, ВПЧ, ОАК…"
                className="w-full rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] py-2 pl-10 pr-3 text-sm"
              />
            </div>
            <LabBlock
              title="А. По нормативному / профилактическому маршруту"
              items={filteredLabs.route}
              states={draft.labStates}
              onCycle={(id, s) => setLab(id, cycleStatus(s))}
            />
            <LabBlock
              title="Б. По клиническим показаниям"
              items={filteredLabs.clinical}
              states={draft.labStates}
              onCycle={(id, s) => setLab(id, cycleStatus(s))}
            />
            <div className="rounded-xl border border-dashed border-[var(--clinical-border)] px-3 py-2">
              <p className="text-xs font-semibold">В. Не рекомендовать рутинно</p>
              <ul className="mt-1 list-inside list-disc text-xs text-[var(--clinical-foreground-muted)]">
                {filteredLabs.notRoutine.map((i) => (
                  <li key={i.id}>{i.labelRu}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold">Каркас записи</h2>
            {CHART_FIELD_IDS.map((fieldId) => (
              <label key={fieldId} className="block space-y-1">
                <span className="text-xs font-semibold text-[var(--clinical-foreground-muted)]">
                  {CHART_FIELD_LABELS[fieldId as ChartFieldId]}
                </span>
                <textarea
                  rows={2}
                  className="w-full rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 py-2 text-sm"
                  value={draft.chartFields[fieldId] ?? ""}
                  onChange={(e) =>
                    update({ ...draft, chartFields: { ...draft.chartFields, [fieldId]: e.target.value } })
                  }
                />
              </label>
            ))}
          </section>

          <div className="sticky bottom-4 flex flex-wrap gap-2 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)]/95 p-3 shadow-lg backdrop-blur">
            <Button type="button" onClick={() => setView("summary")}>
              Итог приёма <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" onClick={() => void handleCopy()}>
              <Copy className="mr-1 h-3.5 w-3.5" /> Копировать
            </Button>
            <Button type="button" variant="outline" onClick={() => setView("regulatory")}>
              Нормы
            </Button>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function ChecklistRow({
  item,
  status,
  note,
  onCycle,
  onNote,
  emphasize,
}: {
  item: DynamicItem;
  status: ItemStatus;
  note?: string;
  onCycle: () => void;
  onNote: (note: string) => void;
  emphasize?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2",
        item.pin === "cervix" || emphasize
          ? "border-[var(--clinical-primary)]/45 bg-[var(--clinical-surface)]"
          : item.important
            ? "border-[var(--clinical-primary)]/30 bg-[var(--clinical-surface)]"
            : "border-[var(--clinical-border)] bg-[var(--clinical-surface)]",
      )}
    >
      <button
        type="button"
        className="flex w-full items-start gap-3 text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]"
        onClick={onCycle}
        aria-pressed={status === "done"}
      >
        <span className="mt-0.5">
          <StatusMark status={status} />
        </span>
        <span>
          {item.label}
          {item.important ? (
            <span className="ml-1 text-[10px] font-bold uppercase text-[var(--clinical-primary)]">важн.</span>
          ) : null}
          {item.pin === "cervix" ? (
            <span className="ml-1 text-[10px] font-bold uppercase text-[var(--clinical-primary-deep)]">шейка</span>
          ) : null}
        </span>
      </button>
      {item.whyRu ? <p className="ml-7 mt-1 text-[11px] text-[var(--clinical-foreground-muted)]">{item.whyRu}</p> : null}
      {item.allowsNote ? (
        <input
          className="ml-7 mt-1 w-[calc(100%-1.75rem)] rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-2 py-1 text-xs"
          value={note ?? ""}
          onChange={(e) => onNote(e.target.value)}
          placeholder="Уточнение / дата предыдущего скрининга"
        />
      ) : null}
    </div>
  );
}

function HubCard({
  title,
  detail,
  onClick,
  primary,
  icon: Icon = ClipboardList,
}: {
  title: string;
  detail: string;
  onClick: () => void;
  primary?: boolean;
  icon?: typeof ClipboardList;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--clinical-primary)]",
        primary
          ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)] shadow-sm"
          : "border-[var(--clinical-border)] bg-[var(--clinical-card)]/85 hover:border-[var(--clinical-primary)]",
      )}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--clinical-primary)]" aria-hidden />
      <span>
        <span className="block font-semibold">{title}</span>
        {detail ? <span className="text-xs text-[var(--clinical-foreground-muted)]">{detail}</span> : null}
      </span>
    </button>
  );
}

function TopBar({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <header className="space-y-1">
      <button type="button" onClick={onBack} className="text-sm text-[var(--clinical-foreground-muted)]">
        ← Назад
      </button>
      <h1 className="text-xl font-semibold">{title}</h1>
    </header>
  );
}

function DocList({
  title,
  docs,
}: {
  title: string;
  docs: ReturnType<typeof listRegulatoryForRegion>["federal"];
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="space-y-2">
        {docs.map((d) => (
          <li key={d.id} className="rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)]/90 px-3 py-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">{d.title}</p>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
                  d.status === "VERIFIED" && "border-emerald-600/50 text-emerald-700 dark:text-emerald-300",
                  d.status === "PARTIAL" && "border-amber-600/50 text-amber-700 dark:text-amber-300",
                  d.status === "REVIEW_REQUIRED" && "border-[var(--clinical-border)] text-[var(--clinical-foreground-muted)]",
                )}
              >
                {REGULATORY_STATUS_LABELS[d.status]}
              </span>
              <span className="text-[10px] text-[var(--clinical-foreground-muted)]">{d.regionCode}</span>
            </div>
            <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">{d.notesRu}</p>
            {d.officialUrl ? (
              <a href={d.officialUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--clinical-primary)] underline">
                Официальный источник
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function LabBlock({
  title,
  items,
  states,
  onCycle,
}: {
  title: string;
  items: ReturnType<typeof labsForReasons>["clinical"];
  states: AmbulatoryIntakeDraft["labStates"];
  onCycle: (id: string, status: ItemStatus) => void;
}) {
  if (!items.length) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-[var(--clinical-foreground-muted)]">{title}</h3>
      {items.map((item) => {
        const status = states[item.id]?.status ?? "empty";
        const cervixLab = item.id === "lab.hpv" || item.id === "lab.cytology" || item.id === "lab.microscopy";
        return (
          <div
            key={item.id}
            className={cn(
              "rounded-xl border px-3 py-2",
              cervixLab
                ? "border-[var(--clinical-primary)]/40 bg-[var(--clinical-surface)]"
                : "border-[var(--clinical-border)] bg-[var(--clinical-surface)]",
            )}
          >
            <button type="button" className="flex w-full items-start gap-3 text-left text-sm" onClick={() => onCycle(item.id, status)}>
              <StatusMark status={status} />
              <span>
                {item.labelRu}
                {cervixLab ? (
                  <span className="ml-1 text-[10px] font-bold uppercase text-[var(--clinical-primary)]">скрининг</span>
                ) : null}
              </span>
            </button>
            <details className="ml-7 mt-1 text-[11px] text-[var(--clinical-foreground-muted)]">
              <summary className="cursor-pointer">Показание / основание</summary>
              <p>Показание: {item.indicationRu}</p>
              <p>Цель: {item.goalRu}</p>
              <p>Основание: {item.basisRu}</p>
              <p>Условия: {item.conditionsRu}</p>
              {item.timingRu ? <p>Сроки: {item.timingRu}</p> : null}
            </details>
          </div>
        );
      })}
    </div>
  );
}
