"use client";

import { useMemo, useState, type ReactNode } from "react";

import {
  fmfScreening,
  type DuctusVenosusAWave,
  type FmfScreeningResult,
  type NasalBone,
} from "@repo/medical-calculations";

/**
 * Учебный раздел «FMF · Скрининг 11–13 недель» (изменение №5).
 * Факты — собственные формулировки по курсу FMF (The 11-13 weeks scan, 2025–2026)
 * с атрибуцией; расчёт — учебная модель fmfScreening (packages/medical-calculations).
 * Копирование текстов/медиа FMF не используется (см. INTEGRATION_MODELS.md, К1/К2).
 */

type Tab = "technique" | "doppler" | "escalation" | "calc";

const TABS: { id: Tab; label: string }[] = [
  { id: "technique", label: "Техника NT" },
  { id: "doppler", label: "Допплер и ЧСС" },
  { id: "escalation", label: "Пороги и эскалация" },
  { id: "calc", label: "Учебный калькулятор" },
];

const ATTRIBUTION =
  "Факты: Fetal Medicine Foundation — курс «The 11-13 weeks scan» (обновления 2025–2026). Изложение и расчётный демонстратор — SonoGyn Pro.";

const DISCLAIMER =
  "Учебный материал и справочный расчёт. Не диагноз, не заменяет сертифицированный софт FMF и клинические рекомендации. Решение остаётся за врачом.";

function Li({ children }: { children: ReactNode }) {
  return <li className="mt-1.5 leading-relaxed">{children}</li>;
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-5">
      <h3 className="text-sm font-bold text-[var(--clinical-primary-deep)]">{title}</h3>
      <ul className="mt-2 list-disc pl-4 text-xs text-[var(--clinical-foreground-muted)]">{children}</ul>
    </div>
  );
}

function Num({ children }: { children: ReactNode }) {
  return <b className="text-[var(--clinical-foreground)]">{children}</b>;
}

const NT_THRESHOLD_FIELDS = ["Возраст матери, лет", "Срок, недель (10–14)", "NT, мм (0.5–10)"] as const;

const inputCls =
  "rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-background)] px-3 py-2 text-sm text-[var(--clinical-foreground)] outline-none focus:border-[var(--clinical-primary)]";
const labelCls = "flex flex-col gap-1 text-xs font-semibold text-[var(--clinical-foreground-muted)]";

export function FmfScreening11Client() {
  const [tab, setTab] = useState<Tab>("technique");

  const [age, setAge] = useState("30");
  const [weeks, setWeeks] = useState("12");
  const [nt, setNt] = useState("");
  const [fhr, setFhr] = useState("");
  const [nb, setNb] = useState<"" | NasalBone>("");
  const [dv, setDv] = useState<"" | DuctusVenosusAWave>("");
  const [tr, setTr] = useState<"" | "yes" | "no">("");
  const [hcg, setHcg] = useState("");
  const [pappa, setPappa] = useState("");

  const result: FmfScreeningResult | null = useMemo(() => {
    const num = (s: string) => {
      const v = parseFloat(s.replace(",", "."));
      return Number.isFinite(v) ? v : undefined;
    };
    try {
      return fmfScreening({
        ageYears: num(age) ?? 30,
        gestationalWeeks: num(weeks) ?? 12,
        ntMm: num(nt),
        fetalHeartRateBpm: num(fhr),
        nasalBone: nb === "" ? undefined : nb,
        ductusVenosusAWave: dv === "" ? undefined : dv,
        tricuspidRegurgitation: tr === "" ? undefined : tr === "yes",
        freeBetaHcgMom: num(hcg),
        pappaMom: num(pappa),
      });
    } catch {
      return null;
    }
  }, [age, weeks, nt, fhr, nb, dv, tr, hcg, pappa]);

  const catStyle = (c: "low" | "intermediate" | "high") =>
    c === "high"
      ? "text-[var(--clinical-danger, #dc2626)]"
      : c === "intermediate"
        ? "text-[var(--clinical-warning, #d97706)]"
        : "text-[var(--clinical-success, #16a34a)]";
  const catLabel = { low: "низкий", intermediate: "промежуточный", high: "высокий" } as const;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Разделы FMF-скрининга">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
              tab === t.id
                ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary)] text-white"
                : "border-[var(--clinical-border)] bg-[var(--clinical-card)] text-[var(--clinical-foreground-muted)] hover:text-[var(--clinical-foreground)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "technique" && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card title="Получение среза">
            <Li>Окно скрининга: <Num>11+0 — 13+6 недель</Num>, КТР <Num>45–84 мм</Num>.</Li>
            <Li>Мид-сагиттальный срез; голова и верх грудной клетки — на весь экран.</Li>
            <Li>Носовая кость и прямоугольное нёбо видны <Num>раздельно</Num> — срез не косой.</Li>
            <Li>Положение головы <Num>нейтральное</Num>: гиперэкстензия ложно завышает NT, флексия занижает.</Li>
            <Li>Отличать кожу плода от амниона.</Li>
          </Card>
          <Card title="Измерение">
            <Li>Измерять <Num>самое широкое место</Num> NT.</Li>
            <Li>Каллипер: <Num>внутренняя граница</Num> перекладины — <Num>по линии</Num> границы, не в жидкости.</Li>
            <Li>При зуме — <Num>gain вниз</Num>, чтобы не попасть на «размытый» край (занижение).</Li>
            <Li><Num>≥2 измерений</Num>; в базу — максимальное валидное.</Li>
            <Li>Пуповина на шее (~5%) завышает NT → для расчёта брать <Num>среднее</Num> выше/ниже пуповины.</Li>
            <Li><Num>99-й центиль ≈ 3.5 мм</Num> — не зависит от КТР.</Li>
          </Card>
        </div>
      )}

      {tab === "doppler" && (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Card title="Ductus venosus">
            <Li>Правый вентральный сагиттальный срез туловища; цветной ДП для навигации.</Li>
            <Li>Sample <Num>0.5–1.0 мм</Num> в зоне алиасинга, угол <Num>&lt;30°</Num>, фильтр <Num>50–70 Гц</Num>, sweep <Num>2–3 см/с</Num>.</Li>
            <Li><Num>Reversed a-wave</Num>: Т21 65% · Т18/13 по 55% · эуплоиды 3%.</Li>
            <Li>Reversed a-wave ↑ риск ВПС и гибели плода (особенно при низком PAPP-A) → детальное исследование сердца.</Li>
          </Card>
          <Card title="Трикуспидальный поток">
            <Li>Апикальный 4-камерный срез, <Num>без цветного ДП</Num> (ненадёжен в I триместре).</Li>
            <Li>Sample <Num>2–3 мм</Num> поперёк клапана, ≥3 позиций, угол <Num>&lt;30°</Num> к межжелудочковой перегородке.</Li>
            <Li>Патология: регургитация <Num>≥½ систолы</Num> и <Num>Vmax &gt;60 см/с</Num> (не путать с аортальным джетом ≤50 см/с).</Li>
            <Li>Частота: Т21 55% · эуплоиды 1%.</Li>
          </Card>
          <Card title="Носовые кости">
            <Li>3 линии в мид-сагиттали профиля: кожа, носовая кость (плотнее кожи), кончик носа; лёгкое покачивание датчика.</Li>
            <Li>Отсутствует: Т21 <Num>60%</Num> · Т18 50% · Т13 40% · эуплоиды 1–3%.</Li>
            <Li>Чаще в 11 нед, при высоком NT.</Li>
          </Card>
          <Card title="ЧСС плода">
            <Li>Пульсовой ДП, <Num>6–10 циклов</Num> в покое.</Li>
            <Li>Норма: 110 (5 нед) → 170 (10 нед) → 150 (14 нед).</Li>
            <Li>Т21 — умеренно ↑ (&gt;95c ~15%); Т18 — ↓ (&lt;5c ~15%); <Num>Т13 — ↑↑ (&gt;95c в 85%)</Num> — отличает от Т18.</Li>
          </Card>
        </div>
      )}

      {tab === "escalation" && (
        <div className="mt-4 space-y-4">
          <div className="rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-5">
            <h3 className="text-sm font-bold text-[var(--clinical-primary-deep)]">Маршрут по значению NT</h3>
            <div className="mt-3 space-y-2 text-xs">
              <div className="rounded-xl border-l-4 border-[var(--clinical-success, #16a34a)] bg-[var(--clinical-muted)]/30 px-4 py-3 text-[var(--clinical-foreground-muted)]">
                <Num>NT &lt; 3.5 мм:</Num> CVS по расчётному риску (возраст + УЗИ + биохимия); детальный скан 11–13 нед → повтор в 20 нед; при норме — заверение (риск не выше популяции).
              </div>
              <div className="rounded-xl border-l-4 border-[var(--clinical-danger, #dc2626)] bg-[var(--clinical-muted)]/30 px-4 py-3 text-[var(--clinical-foreground-muted)]">
                <Num>NT ≥ 3.5 мм</Num> (~1% беременностей): <Num>CVS + кариотип + микроаррей</Num> — независимо от расчётного риска; детальный скан 11–13 нед → повтор ~через 2 нед → 20 нед; при семейном анамнезе — панель ДНК из того же образца.
              </div>
              <div className="rounded-xl border-l-4 border-[var(--clinical-danger, #dc2626)] bg-[var(--clinical-muted)]/30 px-4 py-3 text-[var(--clinical-foreground-muted)]">
                <Num>NT ≥ 5.5 мм:</Num> риск ВПС у эуплоидов ≈ 12.5% → <Num>эхокардиография 14–16 нед и 20–22 нед</Num> (цветной ДП обязателен).
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Масштаб проблемы (для консультации)">
              <Li>Анеуплоидия: 0.2% (NT 5–95c) → <Num>65% при NT ≥6.5 мм</Num>.</Li>
              <Li>Гибель плода (эуплоиды): 1% → ~20% при NT ≥6.5 мм.</Li>
              <Li>NT 3.5–4.4 мм в 12 нед: на 100 плодов ~20 с хромосомной патологией; из 80 эуплоидов ~2 гибель, ~8 порок, <Num>~70 — здоровые дети</Num>. В большинстве случаев NT разрешается — это важно сказать.</Li>
            </Card>
            <Card title="cfDNA: маршрутизация">
              <Li>Выявление Т21 ~99%, Т18/13 ~98%, SP 0.1–0.2% — но это <Num>скрининг</Num>: high-risk подтверждается инвазивно.</Li>
              <Li>Т21 → CVS; Т18/13 → детальный скан: дефекты есть → CVS, нет → амниоцентез (риск CPM).</Li>
              <Li>Отказ теста (1–2%; повтор даёт результат в 80%): при Т18/13 (не Т21) сам по себе признак ↑ риска → вести по детальному скану.</Li>
              <Li>Всем независимо от пути: детальный скан 11–13 нед + скрининг преэклампсии.</Li>
            </Card>
            <Card title="Инвазивная диагностика — сроки">
              <Li><Num>CVS не раньше 11 нед</Num> (ранее — поперечные редукции конечностей).</Li>
              <Li><Num>Амниоцентез не раньше 16 нед</Num> (ранее: +2% выкидышей, +1.5% косолапости).</Li>
              <Li>Риск выкидыша ~1%; у опытных операторов — до ~1/1000.</Li>
            </Card>
            <Card title="Мочевой пузырь и передняя брюшная стенка">
              <Li><Num>Мегацистис ≥7 мм</Num> (~1/1500): 7–15 мм — хромосомные ~20% (Т13/18), при нормальном кариотипе разрешение в 90%; &gt;15 мм — хромосомных ~10%, но всегда обструктивная уропатия.</Li>
              <Li><Num>Омфалоцеле</Num>: хромосомные ~60% (Т18); физиологическая грыжа уходит к <Num>11+5</Num>.</Li>
              <Li>Высокий NT ассоциирован: ВПС, диафрагмальная грыжа, омфалоцеле, мегацистис, body stalk, скелетные дисплазии.</Li>
            </Card>
          </div>
        </div>
      )}

      {tab === "calc" && (
        <div className="mt-4 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
            Учебный калькулятор · принцип FMF «априорный риск × LR»
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className={labelCls}>
              Возраст, лет
              <input value={age} onChange={(e) => setAge(e.target.value)} inputMode="numeric" className={inputCls} />
            </label>
            <label className={labelCls}>
              Срок, недель (10–14)
              <input value={weeks} onChange={(e) => setWeeks(e.target.value)} inputMode="decimal" className={inputCls} />
            </label>
            <label className={labelCls}>
              NT, мм (0.5–10)
              <input value={nt} onChange={(e) => setNt(e.target.value)} inputMode="decimal" placeholder="не измерена" className={inputCls} />
            </label>
            <label className={labelCls}>
              ЧСС, уд/мин
              <input value={fhr} onChange={(e) => setFhr(e.target.value)} inputMode="numeric" placeholder="не оценена" className={inputCls} />
            </label>
            <label className={labelCls}>
              Носовые кости
              <select value={nb} onChange={(e) => setNb(e.target.value as "" | NasalBone)} className={inputCls}>
                <option value="">не оценена</option>
                <option value="present">визуализируется</option>
                <option value="absent">отсутствует</option>
              </select>
            </label>
            <label className={labelCls}>
              DV: волна «a»
              <select value={dv} onChange={(e) => setDv(e.target.value as "" | DuctusVenosusAWave)} className={inputCls}>
                <option value="">не оценён</option>
                <option value="normal">прямой / отсутствующий</option>
                <option value="reversed">реверсированный</option>
              </select>
            </label>
            <label className={labelCls}>
              Трикуспидальная регургитация
              <select value={tr} onChange={(e) => setTr(e.target.value as "" | "yes" | "no")} className={inputCls}>
                <option value="">не оценена</option>
                <option value="no">нет</option>
                <option value="yes">есть</option>
              </select>
            </label>
            <label className={labelCls}>
              свободный β-hCG, MoM
              <input value={hcg} onChange={(e) => setHcg(e.target.value)} inputMode="decimal" placeholder="не сдан" className={inputCls} />
            </label>
            <label className={labelCls}>
              PAPP-A, MoM
              <input value={pappa} onChange={(e) => setPappa(e.target.value)} inputMode="decimal" placeholder="не сдан" className={inputCls} />
            </label>
          </div>

          {result && (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {result.risks.map((r) => (
                  <div key={r.trisomy} className="rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/20 px-4 py-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
                      {r.trisomy === "T21" ? "Трисомия 21" : r.trisomy === "T18" ? "Трисомия 18 · ориентир" : "Трисомия 13 · ориентир"}
                    </p>
                    <p className="mt-1 text-xl font-black text-[var(--clinical-foreground)]">{r.display}</p>
                    <p className={`text-[11px] font-bold ${catStyle(r.category)}`}>{catLabel[r.category]}{r.approximate ? " · учебный ориентир" : ""}</p>
                  </div>
                ))}
              </div>

              <details className="mt-4 rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-background)] px-4 py-3">
                <summary className="cursor-pointer text-xs font-bold text-[var(--clinical-primary-deep)]">
                  Цепочка расчёта (прозрачность): априорный риск {result.priorT21} → итог {result.finalT21}
                </summary>
                <table className="mt-2 w-full text-left text-xs">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
                      <th className="py-1 pr-3">Шаг</th>
                      <th className="py-1 pr-3">LR</th>
                      <th className="py-1 pr-3">Значение</th>
                      <th className="py-1">Риск Т21 после шага</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--clinical-foreground-muted)]">
                    {result.chain.map((s, i) => (
                      <tr key={`${s.test}-${i}`} className="border-t border-[var(--clinical-border)]">
                        <td className="py-1.5 pr-3 font-semibold text-[var(--clinical-foreground)]">{s.test}</td>
                        <td className="py-1.5 pr-3 font-mono">×{s.lr}</td>
                        <td className="py-1.5 pr-3">{s.description}</td>
                        <td className="py-1.5 font-mono">{s.cumulativeRisk}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>

              {result.redFlags.length > 0 && (
                <div className="mt-4 space-y-2">
                  {result.redFlags.map((f) => (
                    <div key={f.code} className="rounded-xl border border-[var(--clinical-danger, #dc2626)]/40 bg-[var(--clinical-danger, #dc2626)]/10 px-4 py-2.5 text-xs text-[var(--clinical-foreground)]">
                      <b>⚠ {f.code.replace(/_/g, " ")}.</b> {f.message}
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-3 text-[11px] leading-relaxed text-[var(--clinical-foreground-muted)]">{result.disclaimer}</p>
            </>
          )}
          <p className="mt-2 text-[10px] text-[var(--clinical-foreground-muted)]">
            Поля: {NT_THRESHOLD_FIELDS.join(" · ")} и доп. маркеры. Расчёт локальный, данные не покидают браузер.
          </p>
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/20 px-4 py-3">
        <p className="text-[11px] text-[var(--clinical-foreground-muted)]">{ATTRIBUTION}</p>
        <p className="mt-1 text-[11px] font-semibold text-[var(--clinical-foreground-muted)]">{DISCLAIMER}</p>
      </div>
    </div>
  );
}
