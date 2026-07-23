"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { LmpDateField } from "@/components/clinical/LmpDateField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RuDateInput } from "@/components/ui/ru-date-input";
import { cn } from "@/lib/utils/cn";
import { formatRuDate, parseIsoDate } from "@/lib/utils/ru-date";
import {
  datingFromAntenatalVisit,
  datingFromBiometryAndUsDate,
  datingFromCrlAndUsDate,
  datingFromMsdAndUsDate,
  datingFromEdd,
  datingFromFetalMovement,
  datingFromGaAtStudy,
  eddFromEmbryoTransfer,
  eddFromLmp,
  eddFromOvulation,
  formatGaTodayLabel,
  formatGestationalAge,
  gaDaysFromLmp,
  lmpFromEdd,
  maternityLeaveHintsRu,
  PREGNANCY_DATING_DISCLAIMER,
  screeningHintsRu,
  splitGaDays,
  type BiometryKind,
} from "@repo/medical-calculations";

const TABS = [
  { id: "lmp", label: "По ПМП" },
  { id: "us", label: "По УЗИ" },
  { id: "crl", label: "По КТР" },
  { id: "msd", label: "По СВД" },
  { id: "ivf", label: "ЭКО / овуляция" },
  { id: "feto", label: "Фетометрия" },
  { id: "dekret", label: "Декрет" },
  { id: "edd", label: "По ПДР" },
  { id: "movement", label: "Шевеления" },
  { id: "antenatal", label: "Явка в ЖК" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isTabId(v: string | null): v is TabId {
  return TABS.some((t) => t.id === v);
}

function ResultBox({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <pre className="clinical-pre whitespace-pre-wrap rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/40 p-4 text-sm leading-relaxed">
      {lines.join("\n")}
    </pre>
  );
}

export function ObCalcHub({ initialTab = "lmp" }: { initialTab?: TabId }) {
  const tab = initialTab;

  const [lmpIso, setLmpIso] = useState<string | undefined>();
  const [usDateIso, setUsDateIso] = useState<string | undefined>();
  const [usWeeks, setUsWeeks] = useState("12");
  const [usDays, setUsDays] = useState("0");
  const [crlDateIso, setCrlDateIso] = useState<string | undefined>();
  const [crlMm, setCrlMm] = useState("");
  const [msdDateIso, setMsdDateIso] = useState<string | undefined>();
  const [msdMm, setMsdMm] = useState("");
  const [ivfMode, setIvfMode] = useState<"ov" | "ivf">("ov");
  const [ivfDateIso, setIvfDateIso] = useState<string | undefined>();
  const [embryoDay, setEmbryoDay] = useState<"3" | "5">("5");
  const [fetoDateIso, setFetoDateIso] = useState<string | undefined>();
  const [fetoKind, setFetoKind] = useState<BiometryKind>("BPD");
  const [fetoMm, setFetoMm] = useState("");
  const [dekretEddIso, setDekretEddIso] = useState<string | undefined>();
  const [reverseEddIso, setReverseEddIso] = useState<string | undefined>();
  const [movementDateIso, setMovementDateIso] = useState<string | undefined>();
  const [movementMultiparous, setMovementMultiparous] = useState(false);
  const [antenatalDateIso, setAntenatalDateIso] = useState<string | undefined>();
  const [antenatalWeeks, setAntenatalWeeks] = useState("12");
  const [antenatalDays, setAntenatalDays] = useState("0");

  const lmpResult = useMemo(() => {
    if (!lmpIso) return [];
    const lmp = parseIsoDate(lmpIso);
    if (!lmp) return ["Проверьте дату ПМП"];
    const today = new Date();
    const totalDays = gaDaysFromLmp(lmp, today);
    const { weeks, days } = splitGaDays(totalDays);
    const edd = eddFromLmp(lmp);
    return [
      `Срок сегодня: ${weeks} нед. ${days} дн. (${totalDays} дн. от ПМП)`,
      `ПДР (Негеле +280 дн.): ${formatRuDate(edd)}`,
      "",
      ...screeningHintsRu(totalDays),
    ];
  }, [lmpIso]);

  const usResult = useMemo(() => {
    if (!usDateIso) return [];
    const us = parseIsoDate(usDateIso);
    if (!us) return ["Проверьте дату УЗИ"];
    const w = Math.max(0, Number.parseInt(usWeeks, 10) || 0);
    const d = Math.min(6, Math.max(0, Number.parseInt(usDays, 10) || 0));
    const gaDays = w * 7 + d;
    const dating = datingFromGaAtStudy(us, gaDays);
    const atStudy = splitGaDays(dating.gaAtStudyDays);
    const gaToday = formatGaTodayLabel(dating);
    return [
      `Срок на дату УЗИ: ${atStudy.weeks} нед. ${atStudy.days} дн.`,
      `ПДР: ${formatRuDate(dating.edd)}`,
      `Оценка ПМП: ${formatRuDate(dating.lmpEstimate)}`,
      gaToday.line,
      "",
      ...screeningHintsRu(gaToday.hintsGaDays),
    ];
  }, [usDateIso, usWeeks, usDays]);

  const crlResult = useMemo(() => {
    if (!crlDateIso || !crlMm.trim()) return [];
    const us = parseIsoDate(crlDateIso);
    const mm = Number.parseFloat(crlMm.replace(",", "."));
    if (!us) return ["Проверьте дату УЗИ"];
    const dating = datingFromCrlAndUsDate(us, mm);
    if (!dating) return ["КТР вне диапазона 2–84 мм"];
    const atStudy = splitGaDays(dating.gaAtStudyDays);
    const gaToday = formatGaTodayLabel(dating);
    return [
      `КТР ${mm} мм → срок на дату УЗИ: ${atStudy.weeks} нед. ${atStudy.days} дн.`,
      `ПДР: ${formatRuDate(dating.edd)}`,
      `Оценка ПМП: ${formatRuDate(dating.lmpEstimate)}`,
      gaToday.line,
      "",
      ...screeningHintsRu(gaToday.hintsGaDays),
    ];
  }, [crlDateIso, crlMm]);

  const msdResult = useMemo(() => {
    if (!msdDateIso || !msdMm.trim()) return [];
    const us = parseIsoDate(msdDateIso);
    const mm = Number.parseFloat(msdMm.replace(",", "."));
    if (!us) return ["Проверьте дату УЗИ"];
    const dating = datingFromMsdAndUsDate(us, mm);
    if (!dating) return ["СВД вне диапазона 6–50 мм (табл. 1.1 Medvedev)"];
    const atStudy = splitGaDays(dating.gaAtStudyDays);
    const gaToday = formatGaTodayLabel(dating);
    return [
      `СВД ${mm} мм → срок на дату УЗИ: ${atStudy.weeks} нед. ${atStudy.days} дн.`,
      `ПДР: ${formatRuDate(dating.edd)}`,
      `Оценка ПМП: ${formatRuDate(dating.lmpEstimate)}`,
      gaToday.line,
      "",
      ...screeningHintsRu(gaToday.hintsGaDays),
    ];
  }, [msdDateIso, msdMm]);

  const ivfResult = useMemo(() => {
    if (!ivfDateIso) return [];
    const d = parseIsoDate(ivfDateIso);
    if (!d) return ["Проверьте дату"];
    if (ivfMode === "ov") {
      const edd = eddFromOvulation(d);
      const lmpSyn = lmpFromEdd(edd);
      return [
        `ПДР (от овуляции +266 дн.): ${formatRuDate(edd)}`,
        `Ориентир «ПМП»: ${formatRuDate(lmpSyn)}`,
        "При нерегулярном цикле и ЭКО используйте дату переноса.",
      ];
    }
    const edd = eddFromEmbryoTransfer(d, embryoDay === "5" ? 5 : 3);
    return [
      `ПДР (перенос D${embryoDay}): ${formatRuDate(edd)}`,
      `Ориентир «ПМП»: ${formatRuDate(lmpFromEdd(edd))}`,
      "Уточняйте протокол клиники ЭКО (D3/D5, blastocyst).",
    ];
  }, [ivfDateIso, ivfMode, embryoDay]);

  const fetoResult = useMemo(() => {
    if (!fetoDateIso || !fetoMm.trim()) return [];
    const us = parseIsoDate(fetoDateIso);
    const mm = Number.parseFloat(fetoMm.replace(",", "."));
    if (!us) return ["Проверьте дату УЗИ"];
    const dating = datingFromBiometryAndUsDate(us, fetoKind, mm);
    if (!dating) return [`${fetoKind} вне допустимого диапазона для ориентира`];
    const gaToday = formatGaTodayLabel(dating);
    return [
      `${fetoKind} ${mm} мм → срок на дату УЗИ: ${formatGestationalAge(dating.gaAtStudyDays)}`,
      `ПДР: ${formatRuDate(dating.edd)}`,
      `Оценка ПМП: ${formatRuDate(dating.lmpEstimate)}`,
      gaToday.line,
      "II–III триместр: ориентир, не замена I триместровой датировки по КТР.",
    ];
  }, [fetoDateIso, fetoKind, fetoMm]);

  const dekretResult = useMemo(() => {
    if (!dekretEddIso) return [];
    const edd = parseIsoDate(dekretEddIso);
    if (!edd) return ["Введите ПДР"];
    const { prenatalStart, note } = maternityLeaveHintsRu(edd);
    return [`ПДР: ${formatRuDate(edd)}`, `Ориентир начала декрета: ${formatRuDate(prenatalStart)}`, "", note];
  }, [dekretEddIso]);

  const eddReverseResult = useMemo(() => {
    if (!reverseEddIso) return [];
    const edd = parseIsoDate(reverseEddIso);
    if (!edd) return ["Введите ПДР"];
    const dating = datingFromEdd(edd);
    const gaToday = formatGaTodayLabel(dating);
    return [
      `ПДР: ${formatRuDate(dating.edd)}`,
      `Оценка ПМП: ${formatRuDate(dating.lmpEstimate)}`,
      gaToday.line,
      "",
      ...(dating.status === "completed" ? [] : screeningHintsRu(gaToday.hintsGaDays)),
    ];
  }, [reverseEddIso]);

  const movementResult = useMemo(() => {
    if (!movementDateIso) return [];
    const d = parseIsoDate(movementDateIso);
    if (!d) return ["Проверьте дату первых шевелений"];
    const r = datingFromFetalMovement(d, movementMultiparous);
    const split = splitGaDays(r.estimatedGaDays);
    return [
      `Срок сегодня (ориентир): ${split.weeks} нед. ${split.days} дн.`,
      `ПДР: ${formatRuDate(r.edd)}`,
      "",
      r.note,
    ];
  }, [movementDateIso, movementMultiparous]);

  const antenatalResult = useMemo(() => {
    if (!antenatalDateIso) return [];
    const visit = parseIsoDate(antenatalDateIso);
    if (!visit) return ["Проверьте дату явки"];
    const w = Math.max(0, Number.parseInt(antenatalWeeks, 10) || 0);
    const days = Math.min(6, Math.max(0, Number.parseInt(antenatalDays, 10) || 0));
    const dating = datingFromAntenatalVisit(visit, w, days);
    const gaToday = formatGaTodayLabel(dating);
    return [
      `ПДР: ${formatRuDate(dating.edd)}`,
      `Оценка ПМП: ${formatRuDate(dating.lmpEstimate)}`,
      gaToday.line,
      "",
      ...screeningHintsRu(gaToday.hintsGaDays),
    ];
  }, [antenatalDateIso, antenatalWeeks, antenatalDays]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 lg:px-8">
      <div className="flex flex-wrap items-start gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tools/calc">← Калькуляторы</Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Калькулятор расчёта срока беременности</h1>
            <Badge variant="outline">ПДР · датировка</Badge>
          </div>
          <p className="mt-1 text-sm text-[var(--clinical-foreground-muted)]">
            ПМП, УЗИ, КТР, СВД, ЭКО, фетометрия, декрет. В поиске: <strong>срок</strong>, <strong>ПДР</strong>,{" "}
            <strong>ПМП</strong>, <strong>датировка</strong>.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div
          className="flex h-auto flex-wrap gap-1 rounded-lg bg-[var(--clinical-muted)] p-1"
          role="tablist"
          aria-label="Способ расчёта срока"
        >
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={`/tools/calc/ob?tab=${t.id}`}
              scroll={false}
              prefetch
              role="tab"
              aria-selected={tab === t.id}
              className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--clinical-primary)] sm:text-sm",
                tab === t.id
                  ? "bg-[var(--clinical-card)] text-[var(--clinical-foreground)] shadow-sm"
                  : "text-[var(--clinical-foreground-muted)] hover:text-[var(--clinical-foreground)]",
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {tab === "lmp" ? (
          <div className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Срок по менструации</CardTitle>
              <CardDescription>ПМП → срок сегодня, ПДР, окна скринингов</CardDescription>
            </CardHeader>
            <CardContent>
              <LmpDateField value={lmpIso} onChange={setLmpIso} showSummary={false} />
              <ResultBox lines={lmpResult} />
            </CardContent>
          </Card>
          </div>
        ) : null}

        {tab === "us" ? (
          <div className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Срок по УЗИ</CardTitle>
              <CardDescription>Дата исследования + срок на момент осмотра</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="block text-sm font-semibold">
                Дата УЗИ
                <RuDateInput className="mt-1" value={usDateIso} onChange={setUsDateIso} />
              </label>
              <div className="flex flex-wrap items-end gap-2">
                <label className="text-sm">
                  Недели
                  <Input className="mt-1 w-20" inputMode="numeric" value={usWeeks} onChange={(e) => setUsWeeks(e.target.value)} />
                </label>
                <label className="text-sm">
                  Дни
                  <Input className="mt-1 w-16" inputMode="numeric" value={usDays} onChange={(e) => setUsDays(e.target.value)} />
                </label>
              </div>
              <ResultBox lines={usResult} />
            </CardContent>
          </Card>
          </div>
        ) : null}

        {tab === "crl" ? (
          <div className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Срок по КТР</CardTitle>
              <CardDescription>I триместр · табличная интерполяция 2–84 мм</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="block text-sm font-semibold">
                Дата УЗИ
                <RuDateInput className="mt-1" value={crlDateIso} onChange={setCrlDateIso} />
              </label>
              <label className="block text-sm font-semibold">
                КТР, мм
                <Input className="mt-1" inputMode="decimal" value={crlMm} onChange={(e) => setCrlMm(e.target.value)} placeholder="62" />
              </label>
              <ResultBox lines={crlResult} />
            </CardContent>
          </Card>
          </div>
        ) : null}

        {tab === "msd" ? (
          <div className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Срок по СВД плодного яйца</CardTitle>
              <CardDescription>Ранний срок · табл. 1.1 Medvedev (Grisolia), СВД 6–50 мм</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="block text-sm font-semibold">
                Дата УЗИ
                <RuDateInput className="mt-1" value={msdDateIso} onChange={setMsdDateIso} />
              </label>
              <label className="block text-sm font-semibold">
                СВД (средний диаметр плодного яйца), мм
                <Input className="mt-1" inputMode="decimal" value={msdMm} onChange={(e) => setMsdMm(e.target.value)} placeholder="10" />
              </label>
              <ResultBox lines={msdResult} />
            </CardContent>
          </Card>
          </div>
        ) : null}

        {tab === "ivf" ? (
          <div className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Овуляция и ЭКО</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant={ivfMode === "ov" ? "default" : "outline"} onClick={() => setIvfMode("ov")}>
                  Овуляция
                </Button>
                <Button type="button" size="sm" variant={ivfMode === "ivf" ? "default" : "outline"} onClick={() => setIvfMode("ivf")}>
                  Перенос эмбриона
                </Button>
              </div>
              {ivfMode === "ivf" ? (
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant={embryoDay === "5" ? "default" : "outline"} onClick={() => setEmbryoDay("5")}>
                    D5
                  </Button>
                  <Button type="button" size="sm" variant={embryoDay === "3" ? "default" : "outline"} onClick={() => setEmbryoDay("3")}>
                    D3
                  </Button>
                </div>
              ) : null}
              <label className="block text-sm font-semibold">
                Дата
                <RuDateInput className="mt-1" value={ivfDateIso} onChange={setIvfDateIso} />
              </label>
              <ResultBox lines={ivfResult} />
            </CardContent>
          </Card>
          </div>
        ) : null}

        {tab === "feto" ? (
          <div className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Срок по фетометрии</CardTitle>
              <CardDescription>BPD / HC / FL / AC — II–III триместр (ориентир)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="block text-sm font-semibold">
                Дата УЗИ
                <RuDateInput className="mt-1" value={fetoDateIso} onChange={setFetoDateIso} />
              </label>
              <div className="flex flex-wrap gap-2">
                {(["BPD", "HC", "FL", "AC"] as BiometryKind[]).map((k) => (
                  <Button key={k} type="button" size="sm" variant={fetoKind === k ? "default" : "outline"} onClick={() => setFetoKind(k)}>
                    {k}
                  </Button>
                ))}
              </div>
              <label className="block text-sm font-semibold">
                {fetoKind}, мм
                <Input className="mt-1" inputMode="decimal" value={fetoMm} onChange={(e) => setFetoMm(e.target.value)} />
              </label>
              <ResultBox lines={fetoResult} />
            </CardContent>
          </Card>
          </div>
        ) : null}

        {tab === "dekret" ? (
          <div className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Декрет · ориентир</CardTitle>
              <CardDescription>Отпуск по БиР ~70 дней до ПДР (упрощённо)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="block text-sm font-semibold">
                Предполагаемая дата родов (ПДР)
                <RuDateInput className="mt-1" value={dekretEddIso} onChange={setDekretEddIso} />
              </label>
              <ResultBox lines={dekretResult} />
            </CardContent>
          </Card>
          </div>
        ) : null}

        {tab === "edd" ? (
          <div className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Срок по предполагаемой дате родов</CardTitle>
              <CardDescription>ПДР → оценка ПМП, срок сегодня, окна скринингов</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="block text-sm font-semibold">
                Предполагаемая дата родов (ПДР)
                <RuDateInput className="mt-1" value={reverseEddIso} onChange={setReverseEddIso} />
              </label>
              <ResultBox lines={eddReverseResult} />
            </CardContent>
          </Card>
          </div>
        ) : null}

        {tab === "movement" ? (
          <div className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Срок по шевелениям плода</CardTitle>
              <CardDescription>Дата первых ощутимых шевелений → ориентир срока</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="block text-sm font-semibold">
                Дата первых шевелений
                <RuDateInput className="mt-1" value={movementDateIso} onChange={setMovementDateIso} />
              </label>
              <Button
                type="button"
                size="sm"
                variant={movementMultiparous ? "default" : "outline"}
                onClick={() => setMovementMultiparous((v) => !v)}
              >
                {movementMultiparous ? "Многородящая" : "Первобеременная"}
              </Button>
              <ResultBox lines={movementResult} />
            </CardContent>
          </Card>
          </div>
        ) : null}

        {tab === "antenatal" ? (
          <div className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Срок по явке в женскую консультацию</CardTitle>
              <CardDescription>Дата постановки на учёт + срок на момент явки</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="block text-sm font-semibold">
                Дата явки / постановки на учёт
                <RuDateInput className="mt-1" value={antenatalDateIso} onChange={setAntenatalDateIso} />
              </label>
              <div className="flex gap-3">
                <label className="block text-sm font-semibold">
                  Нед
                  <Input className="mt-1 w-20" inputMode="numeric" value={antenatalWeeks} onChange={(e) => setAntenatalWeeks(e.target.value)} />
                </label>
                <label className="block text-sm font-semibold">
                  Дн
                  <Input className="mt-1 w-20" inputMode="numeric" value={antenatalDays} onChange={(e) => setAntenatalDays(e.target.value)} />
                </label>
              </div>
              <ResultBox lines={antenatalResult} />
            </CardContent>
          </Card>
          </div>
        ) : null}
      </div>

      <Card className="border-teal-200/70 bg-teal-50/30 dark:border-teal-900/40 dark:bg-teal-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">II–III скрининг · протокол Якубова</CardTitle>
          <CardDescription>
            После расчёта срока откройте FMF-помощник: шаблон «УЗИ + допплер II–III скрин», перцентили Медведева.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button size="sm" asChild>
            <Link href="/ai/consultants/fmf?section=second">II скрининг (18–22 нед.)</Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link href="/ai/consultants/fmf?section=third">III скрининг (34–36 нед.)</Link>
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-[var(--clinical-foreground-muted)]">{PREGNANCY_DATING_DISCLAIMER}</p>
    </div>
  );
}
