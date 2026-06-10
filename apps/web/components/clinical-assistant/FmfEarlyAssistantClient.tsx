"use client";

import { AlertTriangle, ArrowRight, ClipboardList, GraduationCap, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { toast } from "sonner";

import { BasicCourseLinkPanel } from "@/components/education/BasicCourseLinkPanel";
import { ClinicalAssistStrip } from "@/components/clinical-assistant/ClinicalAssistStrip";
import {
  MedvedevMarkerTeachInline,
  MedvedevScreeningWindowsTeach,
} from "@/components/clinical-assistant/MedvedevTeachPanel";
import { FetalSliceAtlasPanel } from "@/components/clinical-assistant/FetalSliceAtlasPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GestationalAgeSummary } from "@/components/clinical/GestationalAgeSummary";
import { LmpDateField } from "@/components/clinical/LmpDateField";
import { Input } from "@/components/ui/input";
import { parseIsoDate } from "@/lib/utils/ru-date";
import { gaDaysFromLmp, splitGaDays } from "@repo/medical-calculations";
import {
  buildCervixProtocol,
  buildDopplerProtocol,
  buildEarlyProtocol,
  buildFirstTrimesterProtocol,
  buildScarProtocol,
  buildSecondThirdProtocol,
  isFirstTrimesterScreeningWindow,
  resolveGestationalAgeText,
  type CervixInput,
  type DopplerInput,
  type ScarInput,
} from "@/lib/clinical-assistant/fmf-protocol";
import { nosologyAssistContextForFmf } from "@/lib/clinical-assistant/nosology-assist-context";
import { cn } from "@/lib/utils/cn";
import {
  analyzeCervix,
  analyzeDoppler,
  analyzeEarly,
  analyzeFirst,
  analyzeScar,
  analyzeSecondThird,
} from "../../../mobile/src/features/fmf/logic/assistantEngine";
import {
  assessFirstTrimesterMedvedev,
  MEDVEDEV_FIRST_TRIMESTER_SOURCE,
  type MedvedevMarkerAssessment,
} from "@repo/medvedev-reference";
import {
  assessSecondThirdMedvedev,
  MEDVEDEV_BIOMETRY_SOURCE,
  type MedvedevBiometryAssessment,
} from "@repo/medvedev-reference";
import { MEDVEDEV_ANATOMY_SOURCE } from "@repo/medvedev-reference";
import {
  assessMedvedevDoppler,
  MEDVEDEV_DV_SOURCE,
  MEDVEDEV_DV_LATE_SOURCE,
  MEDVEDEV_MCA_SOURCE,
  MEDVEDEV_MCA_PSV_SOURCE,
  MEDVEDEV_UA_RI_SOURCE,
  MEDVEDEV_UTA_SOURCE,
  type MedvedevDopplerAssessment,
} from "@repo/medvedev-reference";
import {
  MEDVEDEV_AFI_SOURCE,
  MEDVEDEV_PLACENTA_SOURCE,
  type MedvedevPlacentaAfiAssessment,
} from "@repo/medvedev-reference";
import { gaDaysByCrl, hadlockEfwGrams } from "../../../mobile/src/features/fmf/logic/fmfMath";
import { teachHintForAlert } from "@repo/medvedev-reference";
import type { AssistantOutput, EarlyInput, FirstTrimesterInput, SecondThirdInput } from "../../../mobile/src/features/fmf/types";

export type FmfAssistantSection = "early" | "first" | "second" | "third" | "doppler" | "cervix" | "scar";

const SECTIONS: { id: FmfAssistantSection; label: string; hint: string }[] = [
  { id: "early", label: "Малый срок", hint: "до 11 нед." },
  { id: "first", label: "I скрининг", hint: "11+0 — 13+6" },
  { id: "second", label: "II скрининг", hint: "18–22 нед." },
  { id: "third", label: "III скрининг", hint: "30–34 нед." },
  { id: "doppler", label: "Допплер", hint: "UtA · UA · MCA" },
  { id: "cervix", label: "Шейка", hint: "CL · funneling" },
  { id: "scar", label: "Рубец", hint: "КС · миометрий" },
];

const SECTION_META: Record<
  FmfAssistantSection,
  { formTitle: string; formDescription: string }
> = {
  early: {
    formTitle: "Малый срок — входные данные",
    formDescription: "ДПМ, плодное яйцо, эмбрион, желтое тело. Срок — по КТР, иначе по ДПМ.",
  },
  first: {
    formTitle: "I скрининг — входные данные",
    formDescription: "КТР, ТВП, носовая кость, IV желудочек — перцентили по Медведеву (Прил. 11, КТР 45–84 мм).",
  },
  second: {
    formTitle: "II скрининг — входные данные",
    formDescription: "Фетометрия, анатомия, плацента — перцентили по Медведеву (Прил. 1, 16–40 нед).",
  },
  third: {
    formTitle: "III скрининг — входные данные",
    formDescription: "Рост, AFI, допплер — перцентили по Медведеву (Прил. 1). Окно 30–34 нед.",
  },
  doppler: {
    formTitle: "Допплер — входные данные",
    formDescription: "UtA, DV, АП, СМА — перцентили UtA/DV по Медведеву (Прил. 36 / 40).",
  },
  cervix: {
    formTitle: "Шейка матки — входные данные",
    formDescription: "Трансвагинально: длина шейки (CL), funneling. Риск ПР при CL <25 мм.",
  },
  scar: {
    formTitle: "Рубец на матке — входные данные",
    formDescription: "Толщина миометрия в зоне рубца после КС, однородность структуры.",
  },
};

const FIRST_CHECKLIST = [
  "Срединный сагиттальный срез, нейтральное положение головы",
  "Плод 70–80% экрана, magnify для ТВП",
  "ТВП — строго по FMF (максимум, не среднее)",
  "Носовая кость + допплер DV и TR по протоколу",
  "КТР для датировки, затем расчёт комбинированного риска",
];

type Props = {
  initialSection?: FmfAssistantSection;
};

function parseNum(value: string): number | undefined {
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

export function FmfAssistantClient({ initialSection = "early" }: Props) {
  const [section, setSection] = useState<FmfAssistantSection>(initialSection);
  const [calcMode, setCalcMode] = useState<"quick" | "strict">("strict");
  const [teachMode, setTeachMode] = useState(true);
  const [early, setEarly] = useState<EarlyInput>({});
  const [first, setFirst] = useState<FirstTrimesterInput>({});
  const [secondThird, setSecondThird] = useState<SecondThirdInput>({});
  const [doppler, setDoppler] = useState<DopplerInput>({});
  const [cervix, setCervix] = useState<CervixInput>({});
  const [scar, setScar] = useState<ScarInput>({});

  const earlyOut = useMemo(() => analyzeEarly(early), [early]);
  const firstOut = useMemo(() => analyzeFirst(first), [first]);
  const secondOut = useMemo(() => analyzeSecondThird(secondThird, "second", calcMode), [secondThird, calcMode]);
  const thirdOut = useMemo(() => analyzeSecondThird(secondThird, "third", calcMode), [secondThird, calcMode]);
  const dopplerOut = useMemo(() => analyzeDoppler(doppler), [doppler]);
  const cervixOut = useMemo(() => analyzeCervix(cervix), [cervix]);
  const scarOut = useMemo(() => analyzeScar(scar), [scar]);

  useEffect(() => {
    if (!early.lmpDate) return;
    const lmp = parseIsoDate(early.lmpDate);
    if (!lmp) return;
    const total = gaDaysFromLmp(lmp, new Date());
    if (total < 0) return;
    const { weeks, days } = splitGaDays(total);
    setSecondThird((p) => ({ ...p, gaWeeksByLmp: weeks, gaDaysByLmp: days }));
    setDoppler((p) => ({ ...p, gaWeeks: weeks, gaDays: days }));
  }, [early.lmpDate]);

  const out: AssistantOutput =
    section === "early"
      ? earlyOut
      : section === "first"
        ? firstOut
        : section === "second"
          ? secondOut
          : section === "third"
            ? thirdOut
            : section === "cervix"
              ? cervixOut
              : section === "scar"
                ? scarOut
                : dopplerOut;

  const earlyGa = useMemo(() => resolveGestationalAgeText(early), [early]);
  const firstGa = useMemo(() => resolveGestationalAgeText(first), [first]);
  const screeningWindow = useMemo(() => isFirstTrimesterScreeningWindow(first.crlMm), [first.crlMm]);
  const meta = SECTION_META[section];
  const fmfAssistContext = useMemo(
    () => nosologyAssistContextForFmf(SECTIONS.find((s) => s.id === section)?.label ?? "FMF"),
    [section],
  );

  const gaWeekForTeach = useMemo(() => {
    if (section === "second" || section === "third") return secondThird.gaWeeksByLmp;
    if (section === "first" && first.crlMm != null) {
      const days = gaDaysByCrl(first.crlMm);
      return days != null ? Math.floor(days / 7) : undefined;
    }
    return undefined;
  }, [section, secondThird.gaWeeksByLmp, first.crlMm]);

  const protocolText = useMemo(() => {
    if (section === "early") return buildEarlyProtocol(early, earlyOut.conclusion, earlyOut.recommendations);
    if (section === "first") return buildFirstTrimesterProtocol(first, firstOut.conclusion, firstOut.recommendations);
    if (section === "second") {
      return buildSecondThirdProtocol(secondThird, "second", secondOut.conclusion, secondOut.recommendations);
    }
    if (section === "third") {
      return buildSecondThirdProtocol(secondThird, "third", thirdOut.conclusion, thirdOut.recommendations);
    }
    if (section === "cervix") {
      return buildCervixProtocol(cervix, cervixOut.conclusion, cervixOut.recommendations);
    }
    if (section === "scar") {
      return buildScarProtocol(scar, scarOut.conclusion, scarOut.recommendations);
    }
    return buildDopplerProtocol(doppler, dopplerOut.conclusion, dopplerOut.recommendations);
  }, [
    section,
    early,
    earlyOut,
    first,
    firstOut,
    secondThird,
    secondOut,
    thirdOut,
    doppler,
    dopplerOut,
    cervix,
    cervixOut,
    scar,
    scarOut,
  ]);

  function goToFirstWithTransfer() {
    setFirst((prev) => ({
      ...prev,
      crlMm: early.crlMm ?? prev.crlMm,
      fhr: early.fhr ?? prev.fhr,
      betaHcg: early.bHcg ?? prev.betaHcg,
    }));
    setSection("first");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 lg:px-8">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/assistant/obstetrics">← Помощник акушера</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/reference">Клин. нормы УЗИ</Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href="/library/basic-course">ISUOG · лекция 6</Link>
        </Button>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-teal-700 to-emerald-800 p-6 text-white shadow-xl sm:p-8">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">FMF · беременность</p>
        <h1 className="mt-2 text-2xl font-black sm:text-3xl">FMF · беременность</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/90">
          Помощник врача и учитель одновременно: перцентили Медведева, алерты по протоколу FMF и подсказки «как
          мерить / что значит» на каждом срезе.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTeachMode((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              teachMode
                ? "border-white/40 bg-white/20 text-white"
                : "border-white/20 text-white/70 hover:bg-white/10",
            )}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            {teachMode ? "Учебные подсказки: вкл" : "Учебные подсказки: выкл"}
          </button>
          <Button variant="secondary" size="sm" asChild className="h-8 bg-white/15 text-white hover:bg-white/25">
            <Link href="/reference/norms">Таблица норм</Link>
          </Button>
        </div>
      </div>

      <ClinicalAssistStrip
        context={fmfAssistContext}
        onApplyProtocol={(text) => {
          void navigator.clipboard.writeText(text);
          toast.success("Черновик ИИ скопирован");
        }}
      />

      <nav className="flex flex-wrap gap-2" aria-label="Разделы FMF">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSection(item.id)}
            className={cn(
              "rounded-2xl border px-4 py-3 text-left transition-colors",
              section === item.id
                ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)]"
                : "border-[var(--clinical-border)] bg-[var(--clinical-card)] hover:bg-[var(--clinical-muted)]",
            )}
          >
            <p className="text-sm font-bold">{item.label}</p>
            <p className="text-xs text-[var(--clinical-foreground-muted)]">{item.hint}</p>
          </button>
        ))}
      </nav>

      <Card className="border-[var(--clinical-primary)]/30 bg-[var(--clinical-primary-muted)]/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">ДПМ — один раз для всех разделов</CardTitle>
          <CardDescription>
            Введите первый день последних месячных (например 20.03.2026). Срок подставится в II–III скрининг и допплер.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LmpDateField
            label="ДПМ"
            value={early.lmpDate}
            onChange={(iso) => setEarly((p) => ({ ...p, lmpDate: iso }))}
            showSummary={false}
          />
          <GestationalAgeSummary lmpIso={early.lmpDate} />
        </CardContent>
      </Card>

      {teachMode ? (
        <Card className="border-amber-200/60 bg-amber-50/30 dark:border-amber-900/30 dark:bg-amber-950/10">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <GraduationCap className="h-4 w-4 text-amber-700" />
              Окна скрининга · учебная карта
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MedvedevScreeningWindowsTeach />
          </CardContent>
        </Card>
      ) : null}

      {section === "early" ? <BasicCourseLinkPanel variant="inline" /> : null}

      {section === "first" ? (
        <Card className="border-indigo-200/80 bg-indigo-50/40 dark:border-indigo-900/40 dark:bg-indigo-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Чеклист FMF · I скрининг</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 sm:grid-cols-2">
              {FIRST_CHECKLIST.map((item) => (
                <li key={item} className="flex gap-2 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {section === "second" ? (
        <Card className="border-violet-200/80 bg-violet-50/40 dark:border-violet-900/40 dark:bg-violet-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Атлас срезов · II скрининг</CardTitle>
            <CardDescription>18–22 нед — срезы, нормы Медведева (Прил. 1, 5–20)</CardDescription>
          </CardHeader>
          <CardContent>
            <FetalSliceAtlasPanel teachMode={teachMode} />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Card className="border-[var(--clinical-border)]">
          <CardHeader>
            <CardTitle className="text-lg">{meta.formTitle}</CardTitle>
            <CardDescription>{meta.formDescription}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {section === "second" || section === "third" ? (
              <FieldGroup label="Режим перцентилей">
                <Chip label="Медведев (Прил. 1)" selected={calcMode === "strict"} onClick={() => setCalcMode("strict")} />
                <Chip label="Быстрая оценка" selected={calcMode === "quick"} onClick={() => setCalcMode("quick")} />
              </FieldGroup>
            ) : null}

            {section === "early" ? (
              <EarlyForm early={early} setEarly={setEarly} gaText={earlyGa} onGoToFirst={goToFirstWithTransfer} />
            ) : null}
            {section === "first" ? (
              <FirstForm first={first} setFirst={setFirst} gaText={firstGa} screeningWindow={screeningWindow} />
            ) : null}
            {section === "second" || section === "third" ? (
              <SecondThirdForm
                lmpDate={early.lmpDate}
                onLmpChange={(iso) => setEarly((p) => ({ ...p, lmpDate: iso }))}
                secondThird={secondThird}
                setSecondThird={setSecondThird}
                showAnatomy={section === "second"}
              />
            ) : null}
            {section === "doppler" ? (
              <DopplerForm lmpDate={early.lmpDate} onLmpChange={(iso) => setEarly((p) => ({ ...p, lmpDate: iso }))} doppler={doppler} setDoppler={setDoppler} />
            ) : null}
            {section === "cervix" ? <CervixForm cervix={cervix} setCervix={setCervix} /> : null}
            {section === "scar" ? <ScarForm scar={scar} setScar={setScar} /> : null}
          </CardContent>
        </Card>

        <AssistantOutputPanel
          out={out}
          protocolText={protocolText}
          teachMode={teachMode}
          extra={
            <>
              {section === "first" && firstOut.medvedevMarkers?.length ? (
                <MedvedevReferencePanel
                  title="Перцентили · Прил. 11"
                  markers={firstOut.medvedevMarkers}
                  teachMode={teachMode}
                  week={gaWeekForTeach}
                />
              ) : null}
              {section === "first" && firstOut.medvedevDoppler?.length ? (
                <MedvedevReferencePanel
                  title="Допплер · Прил. 40 / 36"
                  doppler={firstOut.medvedevDoppler}
                  teachMode={teachMode}
                  week={gaWeekForTeach}
                />
              ) : null}
              {section === "doppler" && dopplerOut.medvedevDoppler?.length ? (
                <MedvedevReferencePanel
                  title="Допплер · Медведев"
                  doppler={dopplerOut.medvedevDoppler}
                  teachMode={teachMode}
                />
              ) : null}
              {(section === "second" || section === "third") && out.medvedevBiometry?.length ? (
                <MedvedevReferencePanel
                  title={section === "second" ? "Перцентили · Прил. 1 + 5–20" : "Перцентили · Прил. 1 + допплер"}
                  biometry={out.medvedevBiometry}
                  teachMode={teachMode}
                  week={gaWeekForTeach}
                />
              ) : null}
              {(section === "second" || section === "third") && out.medvedevPlacentaAfi?.length ? (
                <MedvedevReferencePanel
                  title="Плацента и воды · Прил. 34 / 35"
                  placentaAfi={out.medvedevPlacentaAfi}
                  teachMode={teachMode}
                  week={gaWeekForTeach}
                />
              ) : null}
              {(section === "second" || section === "third") && out.medvedevDoppler?.length ? (
                <MedvedevReferencePanel
                  title="Допплер · Прил. 36 / 37 / 38 / 39 / 41"
                  doppler={out.medvedevDoppler}
                  teachMode={teachMode}
                  week={gaWeekForTeach}
                />
              ) : null}
              {section === "first" && screeningWindow === false ? (
                <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
                  КТР указывает на срок вне окна 11+0–13+6. Для I скрининга по FMF нужен повторный визит в
                  скрининговое окно или пересмотр датировки.
                </p>
              ) : null}
            </>
          }
        />
      </div>

      <p className="text-center text-[10px] text-[var(--clinical-foreground-muted)]">
        Не является диагнозом. Интерпретация и решение — лечащий врач.
      </p>
    </div>
  );
}

/** @deprecated alias */
export const FmfEarlyAssistantClient = FmfAssistantClient;

function EarlyForm({
  early,
  setEarly,
  gaText,
  onGoToFirst,
}: {
  early: EarlyInput;
  setEarly: Dispatch<SetStateAction<EarlyInput>>;
  gaText: string;
  onGoToFirst: () => void;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">Срок: {gaText}</Badge>
        {early.crlMm ? (
          <Button type="button" size="sm" variant="secondary" className="gap-1" onClick={onGoToFirst}>
            I скрининг
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <FieldBlock label="β-ХГЧ, МЕ/мл">
          <Input
            inputMode="decimal"
            value={early.bHcg != null ? String(early.bHcg) : ""}
            onChange={(e) => setEarly((p) => ({ ...p, bHcg: parseNum(e.target.value) }))}
          />
        </FieldBlock>
      </div>

      <FieldBlock label="Размеры матки (опц.)">
        <Input
          placeholder="Например: соответствует сроку"
          value={early.uterusSize ?? ""}
          onChange={(e) => setEarly((p) => ({ ...p, uterusSize: e.target.value || undefined }))}
        />
      </FieldBlock>

      <FieldGroup label="Плодное яйцо">
        <Chip label="Да" selected={early.gestationalSacPresent === true} onClick={() => setEarly((p) => ({ ...p, gestationalSacPresent: true }))} />
        <Chip label="Нет" selected={early.gestationalSacPresent === false} onClick={() => setEarly((p) => ({ ...p, gestationalSacPresent: false }))} />
      </FieldGroup>

      <FieldBlock label="СДП, мм">
        <Input
          inputMode="decimal"
          placeholder="Средний диаметр плодного яйца"
          value={early.msdMm != null ? String(early.msdMm) : ""}
          onChange={(e) => setEarly((p) => ({ ...p, msdMm: parseNum(e.target.value) }))}
        />
      </FieldBlock>

      <FieldGroup label="Желточный мешок">
        <Chip label="Да" selected={early.yolkSacSeen === true} onClick={() => setEarly((p) => ({ ...p, yolkSacSeen: true }))} />
        <Chip label="Нет" selected={early.yolkSacSeen === false} onClick={() => setEarly((p) => ({ ...p, yolkSacSeen: false }))} />
      </FieldGroup>

      <FieldGroup label="Эмбрион">
        <Chip label="Да" selected={early.embryoPresent === true} onClick={() => setEarly((p) => ({ ...p, embryoPresent: true }))} />
        <Chip label="Нет" selected={early.embryoPresent === false} onClick={() => setEarly((p) => ({ ...p, embryoPresent: false }))} />
      </FieldGroup>

      <div className="grid gap-3 sm:grid-cols-2">
        <FieldBlock label="КТР, мм">
          <Input
            inputMode="decimal"
            value={early.crlMm != null ? String(early.crlMm) : ""}
            onChange={(e) => setEarly((p) => ({ ...p, crlMm: parseNum(e.target.value) }))}
          />
        </FieldBlock>
        <FieldBlock label="ЧСС, уд/мин">
          <Input
            inputMode="numeric"
            value={early.fhr != null ? String(early.fhr) : ""}
            onChange={(e) => setEarly((p) => ({ ...p, fhr: parseNum(e.target.value) }))}
          />
        </FieldBlock>
      </div>

      <FieldGroup label="Желтое тело">
        <Chip label="Да" selected={early.corpusLuteumPresent === true} onClick={() => setEarly((p) => ({ ...p, corpusLuteumPresent: true }))} />
        <Chip
          label="Нет"
          selected={early.corpusLuteumPresent === false}
          onClick={() =>
            setEarly((p) => ({
              ...p,
              corpusLuteumPresent: false,
              corpusLuteumSide: undefined,
              corpusLuteumSizeMm: undefined,
            }))
          }
        />
      </FieldGroup>

      {early.corpusLuteumPresent ? (
        <>
          <FieldGroup label="Локализация ЖТ">
            <Chip label="Правый" selected={early.corpusLuteumSide === "right"} onClick={() => setEarly((p) => ({ ...p, corpusLuteumSide: "right" }))} />
            <Chip label="Левый" selected={early.corpusLuteumSide === "left"} onClick={() => setEarly((p) => ({ ...p, corpusLuteumSide: "left" }))} />
          </FieldGroup>
          <FieldBlock label="Диаметр ЖТ, мм">
            <Input
              inputMode="decimal"
              value={early.corpusLuteumSizeMm != null ? String(early.corpusLuteumSizeMm) : ""}
              onChange={(e) => setEarly((p) => ({ ...p, corpusLuteumSizeMm: parseNum(e.target.value) }))}
            />
          </FieldBlock>
        </>
      ) : null}

      <FieldGroup label="Контуры ПЯ">
        <Chip label="Ровные" selected={early.sacContourNormal === true} onClick={() => setEarly((p) => ({ ...p, sacContourNormal: true }))} />
        <Chip label="Неровные" selected={early.sacContourNormal === false} onClick={() => setEarly((p) => ({ ...p, sacContourNormal: false }))} />
      </FieldGroup>

      <FieldGroup label="Локализация">
        <Chip label="Маточная" selected={early.pregnancyLocation === "uterine"} onClick={() => setEarly((p) => ({ ...p, pregnancyLocation: "uterine" }))} />
        <Chip label="Внематочная?" selected={early.pregnancyLocation === "ectopic"} onClick={() => setEarly((p) => ({ ...p, pregnancyLocation: "ectopic" }))} />
      </FieldGroup>

      <FieldGroup label="Ретрохориальная гематома">
        <Chip label="Да" selected={early.retrochorionicHematoma === true} onClick={() => setEarly((p) => ({ ...p, retrochorionicHematoma: true }))} />
        <Chip label="Нет" selected={early.retrochorionicHematoma === false} onClick={() => setEarly((p) => ({ ...p, retrochorionicHematoma: false }))} />
      </FieldGroup>
    </>
  );
}

function FirstForm({
  first,
  setFirst,
  gaText,
  screeningWindow,
}: {
  first: FirstTrimesterInput;
  setFirst: Dispatch<SetStateAction<FirstTrimesterInput>>;
  gaText: string;
  screeningWindow: boolean | null;
}) {
  const liveMarkers = useMemo(() => assessFirstTrimesterMedvedev(first), [first]);
  const liveDoppler = useMemo(
    () =>
      assessMedvedevDoppler({
        gaDaysTotal: first.crlMm ? gaDaysByCrl(first.crlMm) : null,
        dvPi: first.dvPi,
        uterinePiRight: first.uterinePiRight,
        uterinePiLeft: first.uterinePiLeft,
      }),
    [first],
  );

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">Срок по КТР: {gaText}</Badge>
        {screeningWindow === true ? <Badge className="bg-emerald-600">Окно I скрининга</Badge> : null}
        {screeningWindow === false ? (
          <Badge variant="outline" className="border-amber-400 text-amber-800">
            Вне 11+0–13+6
          </Badge>
        ) : null}
      </div>

      {first.crlMm ? (
        <>
          <MedvedevReferencePanel title="Перцентили · Прил. 11" markers={liveMarkers} compact />
          {liveDoppler.length ? (
            <MedvedevReferencePanel title="Допплер · Прил. 40 / 36" doppler={liveDoppler} compact />
          ) : null}
        </>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <FieldBlock label="КТР, мм">
          <Input
            inputMode="decimal"
            value={first.crlMm != null ? String(first.crlMm) : ""}
            onChange={(e) => setFirst((p) => ({ ...p, crlMm: parseNum(e.target.value) }))}
          />
        </FieldBlock>
        <FieldBlock label="ТВП (NT), мм">
          <Input
            inputMode="decimal"
            value={first.ntMm != null ? String(first.ntMm) : ""}
            onChange={(e) => setFirst((p) => ({ ...p, ntMm: parseNum(e.target.value) }))}
          />
        </FieldBlock>
        <FieldBlock label="ЧСС, уд/мин">
          <Input
            inputMode="numeric"
            value={first.fhr != null ? String(first.fhr) : ""}
            onChange={(e) => setFirst((p) => ({ ...p, fhr: parseNum(e.target.value) }))}
          />
        </FieldBlock>
      </div>

      <FieldGroup label="Носовая кость">
        <Chip label="Визуализируется" selected={first.nasalBone === "seen"} onClick={() => setFirst((p) => ({ ...p, nasalBone: "seen" }))} />
        <Chip label="Не визуализируется" selected={first.nasalBone === "not_seen"} onClick={() => setFirst((p) => ({ ...p, nasalBone: "not_seen" }))} />
        <Chip label="Оценка затруднена" selected={first.nasalBone === "uncertain"} onClick={() => setFirst((p) => ({ ...p, nasalBone: "uncertain" }))} />
      </FieldGroup>

      <div className="grid gap-3 sm:grid-cols-2">
        <FieldBlock label="Длина носовой кости, мм (опц.)">
          <Input
            inputMode="decimal"
            placeholder="ДНК для перцентиля"
            value={first.nasalBoneLengthMm != null ? String(first.nasalBoneLengthMm) : ""}
            onChange={(e) => setFirst((p) => ({ ...p, nasalBoneLengthMm: parseNum(e.target.value) }))}
          />
        </FieldBlock>
        <FieldBlock label="IV желудочек (ПЗР), мм (опц.)">
          <Input
            inputMode="decimal"
            placeholder="ПЗР для перцентиля"
            value={first.ivVentricleMm != null ? String(first.ivVentricleMm) : ""}
            onChange={(e) => setFirst((p) => ({ ...p, ivVentricleMm: parseNum(e.target.value) }))}
          />
        </FieldBlock>
      </div>

      <FieldGroup label="Венозный проток (DV)">
        <Chip label="Норма" selected={first.dvFlow === "normal"} onClick={() => setFirst((p) => ({ ...p, dvFlow: "normal" }))} />
        <Chip label="Патология" selected={first.dvFlow === "abnormal"} onClick={() => setFirst((p) => ({ ...p, dvFlow: "abnormal" }))} />
        <Chip label="Не оценён" selected={first.dvFlow === "unknown"} onClick={() => setFirst((p) => ({ ...p, dvFlow: "unknown" }))} />
      </FieldGroup>

      <div className="grid gap-3 sm:grid-cols-3">
        <FieldBlock label="ПИ венозного протока (опц.)">
          <Input
            inputMode="decimal"
            placeholder="DV PI"
            value={first.dvPi != null ? String(first.dvPi) : ""}
            onChange={(e) => setFirst((p) => ({ ...p, dvPi: parseNum(e.target.value) }))}
          />
        </FieldBlock>
        <FieldBlock label="PI маточной справа (опц.)">
          <Input
            inputMode="decimal"
            value={first.uterinePiRight != null ? String(first.uterinePiRight) : ""}
            onChange={(e) => setFirst((p) => ({ ...p, uterinePiRight: parseNum(e.target.value) }))}
          />
        </FieldBlock>
        <FieldBlock label="PI маточной слева (опц.)">
          <Input
            inputMode="decimal"
            value={first.uterinePiLeft != null ? String(first.uterinePiLeft) : ""}
            onChange={(e) => setFirst((p) => ({ ...p, uterinePiLeft: parseNum(e.target.value) }))}
          />
        </FieldBlock>
      </div>

      <FieldGroup label="Трикуспидальная регургитация">
        <Chip label="Нет" selected={first.tricuspidRegurg === "none"} onClick={() => setFirst((p) => ({ ...p, tricuspidRegurg: "none" }))} />
        <Chip label="Есть" selected={first.tricuspidRegurg === "present"} onClick={() => setFirst((p) => ({ ...p, tricuspidRegurg: "present" }))} />
        <Chip label="Не оценена" selected={first.tricuspidRegurg === "unknown"} onClick={() => setFirst((p) => ({ ...p, tricuspidRegurg: "unknown" }))} />
      </FieldGroup>

      <div className="grid gap-3 sm:grid-cols-2">
        <FieldBlock label="PAPP-A, МЕ/л">
          <Input
            inputMode="decimal"
            value={first.pappA != null ? String(first.pappA) : ""}
            onChange={(e) => setFirst((p) => ({ ...p, pappA: parseNum(e.target.value) }))}
          />
        </FieldBlock>
        <FieldBlock label="β-ХГЧ, МЕ/мл">
          <Input
            inputMode="decimal"
            value={first.betaHcg != null ? String(first.betaHcg) : ""}
            onChange={(e) => setFirst((p) => ({ ...p, betaHcg: parseNum(e.target.value) }))}
          />
        </FieldBlock>
      </div>
    </>
  );
}

function SecondThirdForm({
  lmpDate,
  onLmpChange,
  secondThird,
  setSecondThird,
  showAnatomy,
}: {
  lmpDate?: string;
  onLmpChange: (iso: string | undefined) => void;
  secondThird: SecondThirdInput;
  setSecondThird: Dispatch<SetStateAction<SecondThirdInput>>;
  showAnatomy?: boolean;
}) {
  const setNum = (key: keyof SecondThirdInput) => (value?: number) =>
    setSecondThird((p) => ({ ...p, [key]: value }));

  const liveBiometry = useMemo(() => {
    const efw = hadlockEfwGrams({
      bpd: secondThird.bpd,
      hc: secondThird.hc,
      ac: secondThird.ac,
      fl: secondThird.fl,
    });
    return assessSecondThirdMedvedev({ ...secondThird, efwGrams: efw ?? undefined });
  }, [secondThird]);

  const gaLabel =
    secondThird.gaWeeksByLmp !== undefined
      ? `${secondThird.gaWeeksByLmp} нед ${secondThird.gaDaysByLmp ?? 0} д`
      : null;

  return (
    <>
      {gaLabel ? <Badge variant="outline">Срок: {gaLabel}</Badge> : null}

      {secondThird.gaWeeksByLmp !== undefined && liveBiometry.length ? (
        <MedvedevReferencePanel
          title={showAnatomy ? "Перцентили · Прил. 1 + 5–12" : "Перцентили · Прил. 1"}
          biometry={liveBiometry}
          compact
        />
      ) : null}
      <FieldGroup label="Положение плода">
        <Chip
          label="Головное"
          selected={secondThird.fetusPresentation === "cephalic"}
          onClick={() => setSecondThird((p) => ({ ...p, fetusPresentation: "cephalic" }))}
        />
        <Chip
          label="Тазовое"
          selected={secondThird.fetusPresentation === "breech"}
          onClick={() => setSecondThird((p) => ({ ...p, fetusPresentation: "breech" }))}
        />
        <Chip
          label="Поперечное"
          selected={secondThird.fetusPresentation === "transverse"}
          onClick={() => setSecondThird((p) => ({ ...p, fetusPresentation: "transverse" }))}
        />
      </FieldGroup>

      {!lmpDate ? (
        <LmpDateField
          label="ДПМ — срок для перцентилей"
          value={lmpDate}
          onChange={onLmpChange}
          showSummary={false}
        />
      ) : (
        <GestationalAgeSummary lmpIso={lmpDate} compact />
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NumField label="BPD, мм" value={secondThird.bpd} onChange={setNum("bpd")} />
        <NumField label="OFD, мм" value={secondThird.ofd} onChange={setNum("ofd")} />
        <NumField label="HC, мм" value={secondThird.hc} onChange={setNum("hc")} />
        <NumField label="AC, мм" value={secondThird.ac} onChange={setNum("ac")} />
        <NumField label="FL, мм" value={secondThird.fl} onChange={setNum("fl")} />
        <NumField label="ЧСС" value={secondThird.fhr} onChange={setNum("fhr")} />
        <NumField label="Лат. желудочки, мм" value={secondThird.lateralVentriclesMm} onChange={setNum("lateralVentriclesMm")} />
        <NumField label="Мозжечок, мм" value={secondThird.cerebellumMm} onChange={setNum("cerebellumMm")} />
        <NumField label="Большая цистерна, мм" value={secondThird.cisternaMagnaMm} onChange={setNum("cisternaMagnaMm")} />
        <NumField label="ИАЖ, см" value={secondThird.afiCm} onChange={setNum("afiCm")} />
        <NumField label="Толщина плаценты, мм · Прил. 34" value={secondThird.placentaThicknessMm} onChange={setNum("placentaThicknessMm")} />
        <NumField label="Плацента до ЗВ, см" value={secondThird.placentaDistanceToOsCm} onChange={setNum("placentaDistanceToOsCm")} />
        <NumField label="CL шейки, мм" value={secondThird.cervixLengthMm} onChange={setNum("cervixLengthMm")} />
      </div>

      {showAnatomy ? (
        <>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
            Мозг и лицо · II трим. (опц., Медведев Прил. 5–12)
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <NumField label="ДМТ, мм" value={secondThird.corpusCallosumLengthMm} onChange={setNum("corpusCallosumLengthMm")} />
            <NumField label="ППП, мм" value={secondThird.cspWidthMm} onChange={setNum("cspWidthMm")} />
            <NumField label="Зр. тракты, мм" value={secondThird.opticTractThicknessMm} onChange={setNum("opticTractThicknessMm")} />
            <NumField label="ККР мозжечка, мм" value={secondThird.cerebellumCrMm} onChange={setNum("cerebellumCrMm")} />
            <NumField label="ПЗР мозжечка, мм" value={secondThird.cerebellumApMm} onChange={setNum("cerebellumApMm")} />
            <NumField label="Сильвиева б., мм" value={secondThird.sylvianDepthMm} onChange={setNum("sylvianDepthMm")} />
            <NumField label="Угол ствол–мозж., °" value={secondThird.cerebellarAngleDeg} onChange={setNum("cerebellarAngleDeg")} />
            <NumField label="Длина носа, мм" value={secondThird.nasalBoneLengthMm} onChange={setNum("nasalBoneLengthMm")} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
            Орбиты · тимус · сердце (опц., Прил. 13–20)
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <NumField label="Экстраорбит., мм" value={secondThird.orbitExtraMm} onChange={setNum("orbitExtraMm")} />
            <NumField label="Интраорбит., мм" value={secondThird.orbitIntraMm} onChange={setNum("orbitIntraMm")} />
            <NumField label="Диам. глазницы, мм" value={secondThird.orbitDiameterMm} onChange={setNum("orbitDiameterMm")} />
            <NumField label="Периметр тимуса, мм" value={secondThird.thymusPerimeterMm} onChange={setNum("thymusPerimeterMm")} />
            <NumField label="Тимус попер., см" value={secondThird.thymusTransverseCm} onChange={setNum("thymusTransverseCm")} />
            <NumField label="Лев. предсердие, мм" value={secondThird.leftAtriumMm} onChange={setNum("leftAtriumMm")} />
            <NumField label="Прав. предсердие, мм" value={secondThird.rightAtriumMm} onChange={setNum("rightAtriumMm")} />
            <NumField label="Лев. желудочек, мм" value={secondThird.leftVentricleMm} onChange={setNum("leftVentricleMm")} />
            <NumField label="Прав. желудочек, мм" value={secondThird.rightVentricleMm} onChange={setNum("rightVentricleMm")} />
            <NumField label="Диам. аорты, мм" value={secondThird.aortaMm} onChange={setNum("aortaMm")} />
          </div>
        </>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NumField label="PI мат. артерий (ср.)" value={secondThird.uterinePiMean} onChange={setNum("uterinePiMean")} />
        <NumField label="PI АП" value={secondThird.uaPi} onChange={setNum("uaPi")} />
        <NumField label="ИР АП (RI) · Прил. 37" value={secondThird.uaRi} onChange={setNum("uaRi")} />
        <NumField label="PI СМА" value={secondThird.mcaPi} onChange={setNum("mcaPi")} />
        <NumField label="PSV СМА · Прил. 38" value={secondThird.mcaPsv} onChange={setNum("mcaPsv")} />
        <NumField label="PI DV" value={secondThird.dvPi} onChange={setNum("dvPi")} />
      </div>

      <FieldGroup label="Носовые кости">
        <Chip label="Да" selected={secondThird.nasalBoneSeen === true} onClick={() => setSecondThird((p) => ({ ...p, nasalBoneSeen: true }))} />
        <Chip label="Нет" selected={secondThird.nasalBoneSeen === false} onClick={() => setSecondThird((p) => ({ ...p, nasalBoneSeen: false }))} />
      </FieldGroup>

      <FieldGroup label="Желудок">
        <Chip label="Да" selected={secondThird.stomachSeen === true} onClick={() => setSecondThird((p) => ({ ...p, stomachSeen: true }))} />
        <Chip label="Нет" selected={secondThird.stomachSeen === false} onClick={() => setSecondThird((p) => ({ ...p, stomachSeen: false }))} />
      </FieldGroup>

      <FieldGroup label="Мочевой пузырь">
        <Chip label="Да" selected={secondThird.bladderSeen === true} onClick={() => setSecondThird((p) => ({ ...p, bladderSeen: true }))} />
        <Chip label="Нет" selected={secondThird.bladderSeen === false} onClick={() => setSecondThird((p) => ({ ...p, bladderSeen: false }))} />
      </FieldGroup>
    </>
  );
}

function DopplerForm({
  lmpDate,
  onLmpChange,
  doppler,
  setDoppler,
}: {
  lmpDate?: string;
  onLmpChange: (iso: string | undefined) => void;
  doppler: DopplerInput;
  setDoppler: Dispatch<SetStateAction<DopplerInput>>;
}) {
  const setNum = (key: keyof DopplerInput) => (value?: number) => setDoppler((p) => ({ ...p, [key]: value }));

  const gaLabel =
    doppler.gaWeeks !== undefined ? `${doppler.gaWeeks} нед ${doppler.gaDays ?? 0} д` : null;

  const liveDoppler = useMemo(
    () =>
      assessMedvedevDoppler({
        gaDaysTotal:
          doppler.gaWeeks !== undefined ? doppler.gaWeeks * 7 + (doppler.gaDays ?? 0) : null,
        dvPi: doppler.dvPi,
        uterinePiRight: doppler.piRight,
        uterinePiLeft: doppler.piLeft,
        mcaPi: doppler.piMca,
        mcaPsv: doppler.mcaPsv,
        uaRi: doppler.uaRi,
      }),
    [doppler],
  );

  return (
    <div className="space-y-4">
      {gaLabel ? <Badge variant="outline">Срок: {gaLabel}</Badge> : null}
      {!lmpDate ? (
        <LmpDateField label="ДПМ — срок для допплера" value={lmpDate} onChange={onLmpChange} showSummary={false} />
      ) : (
        <GestationalAgeSummary lmpIso={lmpDate} compact />
      )}

      {doppler.gaWeeks !== undefined && liveDoppler.length ? (
        <MedvedevReferencePanel title="Допплер · Прил. 36 / 37 / 38 / 39 / 41" doppler={liveDoppler} compact />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <NumField label="PI маточной справа" value={doppler.piRight} onChange={setNum("piRight")} />
        <NumField label="PI маточной слева" value={doppler.piLeft} onChange={setNum("piLeft")} />
        <NumField label="ИР АП (RI) · Прил. 37" value={doppler.uaRi} onChange={setNum("uaRi")} />
        <NumField label="PI СМА · Прил. 39" value={doppler.piMca} onChange={setNum("piMca")} />
        <NumField label="PSV СМА · Прил. 38" value={doppler.mcaPsv} onChange={setNum("mcaPsv")} />
        <NumField label="PI венозного протока" value={doppler.dvPi} onChange={setNum("dvPi")} />
        <NumField label="PI АП (legacy)" value={doppler.piUmb} onChange={setNum("piUmb")} />
      </div>
      <p className="text-[10px] text-[var(--clinical-foreground-muted)]">
        Медведев 2016: для пуповины — таблица <strong>RI</strong> (Прил. 37), не PI. PI UA — для локальных протоколов.
      </p>
    </div>
  );
}

function CervixForm({
  cervix,
  setCervix,
}: {
  cervix: CervixInput;
  setCervix: Dispatch<SetStateAction<CervixInput>>;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">Трансвагинально · CL</Badge>
        {typeof cervix.lengthMm === "number" && cervix.lengthMm < 25 ? (
          <Badge variant="outline" className="border-amber-400 text-amber-800">
            CL &lt;25 мм
          </Badge>
        ) : null}
        <Button variant="outline" size="sm" asChild>
          <Link href="/calculators/cervical-length">Калькулятор CL →</Link>
        </Button>
      </div>
      <NumField label="Длина шейки (CL), мм" value={cervix.lengthMm} onChange={(v) => setCervix((p) => ({ ...p, lengthMm: v }))} />
      <FieldGroup label="Funneling внутреннего зева">
        <Chip label="Нет" selected={cervix.funneling === false} onClick={() => setCervix((p) => ({ ...p, funneling: false }))} />
        <Chip label="Есть" selected={cervix.funneling === true} onClick={() => setCervix((p) => ({ ...p, funneling: true }))} />
      </FieldGroup>
    </>
  );
}

function ScarForm({
  scar,
  setScar,
}: {
  scar: ScarInput;
  setScar: Dispatch<SetStateAction<ScarInput>>;
}) {
  return (
    <>
      <NumField
        label="Толщина миометрия в зоне рубца, мм"
        value={scar.thicknessMm}
        onChange={(v) => setScar((p) => ({ ...p, thicknessMm: v }))}
      />
      <FieldGroup label="Структура рубца">
        <Chip
          label="Однородная"
          selected={scar.structure === "homogeneous"}
          onClick={() => setScar((p) => ({ ...p, structure: "homogeneous" }))}
        />
        <Chip
          label="Неоднородная"
          selected={scar.structure === "heterogeneous"}
          onClick={() => setScar((p) => ({ ...p, structure: "heterogeneous" }))}
        />
      </FieldGroup>
      {typeof scar.thicknessMm === "number" && scar.thicknessMm < 2.5 ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          Толщина &lt;2.5 мм — признак несостоятельности рубца по УЗ-критериям. Нужна клиническая корреляция.
        </p>
      ) : null}
    </>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (value?: number) => void;
}) {
  return (
    <FieldBlock label={label}>
      <Input
        inputMode="decimal"
        value={value != null ? String(value) : ""}
        onChange={(e) => onChange(parseNum(e.target.value))}
      />
    </FieldBlock>
  );
}

function AssistantOutputPanel({
  out,
  protocolText,
  extra,
  teachMode = true,
}: {
  out: AssistantOutput;
  protocolText: string;
  extra?: ReactNode;
  teachMode?: boolean;
}) {
  return (
    <div className="space-y-4">
      <Card className="border-[var(--clinical-border)]">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--clinical-primary)]" />
            <CardTitle className="text-lg">Ассистивный разбор</CardTitle>
          </div>
          <CardDescription>Следующий шаг: {out.nextPrompt}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {extra}

          {out.missingQuestions.length ? (
            <div className="rounded-xl bg-[var(--clinical-muted)] p-3 text-sm">
              <p className="font-bold">Уточнить:</p>
              <ul className="mt-2 space-y-1 text-[var(--clinical-foreground-muted)]">
                {out.missingQuestions.map((q) => (
                  <li key={q}>• {q}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {out.alerts.length ? (
            <div className="space-y-2">
              {out.alerts.map((alert) => {
                const teach = teachMode ? teachHintForAlert(alert) : null;
                return (
                  <div
                    key={alert}
                    className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-100"
                  >
                    <p className="flex gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                      {alert}
                    </p>
                    {teach ? (
                      <p className="mt-2 flex gap-1.5 border-t border-red-200/60 pt-2 text-xs italic text-red-800/90 dark:border-red-900/40 dark:text-red-200/90">
                        <GraduationCap className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {teach}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <Badge className="bg-emerald-600">Критичных отклонений по введённым данным нет</Badge>
          )}

          {out.hypotheses.length ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">Гипотезы</p>
              <ul className="mt-2 space-y-1 text-sm">
                {out.hypotheses.map((h) => (
                  <li key={h}>• {h}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">
              Что должно быть на экране
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[var(--clinical-foreground-muted)]">
              {out.visualHints.map((hint) => (
                <li key={hint}>• {hint}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-primary-deep)]">Заключение</p>
            <p className="mt-2 text-sm leading-relaxed">{out.conclusion}</p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">Рекомендации</p>
            <ul className="mt-2 space-y-1 text-sm">
              {out.recommendations.map((r) => (
                <li key={r}>• {r}</li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[var(--clinical-border)]">
        <CardHeader>
          <CardTitle className="text-base">Протокол для вставки</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <pre className="max-h-64 overflow-auto rounded-xl bg-[var(--clinical-muted)] p-3 text-xs leading-relaxed whitespace-pre-wrap">
            {protocolText}
          </pre>
          <Button
            type="button"
            size="sm"
            className="gap-2"
            onClick={() => {
              void navigator.clipboard.writeText(protocolText).then(
                () => toast.success("Протокол скопирован"),
                () => toast.error("Не удалось скопировать"),
              );
            }}
          >
            <ClipboardList className="h-4 w-4" />
            Копировать протокол
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        selected
          ? "border-[var(--clinical-primary)] bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]"
          : "border-[var(--clinical-border)] text-[var(--clinical-foreground-muted)] hover:bg-[var(--clinical-muted)]",
      )}
    >
      {label}
    </button>
  );
}

function FieldGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function MedvedevReferencePanel({
  title,
  markers,
  biometry,
  doppler,
  placentaAfi,
  compact,
  teachMode = true,
  week,
}: {
  title: string;
  markers?: MedvedevMarkerAssessment[];
  biometry?: MedvedevBiometryAssessment[];
  doppler?: MedvedevDopplerAssessment[];
  placentaAfi?: MedvedevPlacentaAfiAssessment[];
  compact?: boolean;
  teachMode?: boolean;
  week?: number;
}) {
  const rows = [
    ...(markers ?? []).map((m) => ({
      key: m.marker,
      label: m.label,
      summary: m.summary,
      percentile: m.percentile,
      flag: m.flag,
    })),
    ...(biometry ?? []).map((m) => ({
      key: String(m.marker),
      label: m.label,
      summary: m.summary,
      percentile: m.percentile,
      flag: m.flag,
    })),
    ...(placentaAfi ?? []).map((m) => ({
      key: m.marker,
      label: m.label,
      summary: m.summary,
      percentile: m.percentile,
      flag: m.flag,
    })),
    ...(doppler ?? []).map((m) => ({
      key: m.marker,
      label: m.label,
      summary: m.summary,
      percentile: m.percentile,
      flag: m.flag,
    })),
  ];

  if (rows.length === 0) return null;

  const sourceNote = doppler?.length
    ? `${MEDVEDEV_DV_SOURCE} · ${MEDVEDEV_DV_LATE_SOURCE} · ${MEDVEDEV_UTA_SOURCE} · ${MEDVEDEV_UA_RI_SOURCE} · ${MEDVEDEV_MCA_SOURCE} · ${MEDVEDEV_MCA_PSV_SOURCE}`
    : placentaAfi?.length
      ? `${MEDVEDEV_AFI_SOURCE} · ${MEDVEDEV_PLACENTA_SOURCE}`
      : biometry?.length
      ? `${MEDVEDEV_BIOMETRY_SOURCE}${biometry.some((b) => b.marker === "corpusCallosum" || b.marker === "csp") ? ` · ${MEDVEDEV_ANATOMY_SOURCE}` : ""}`
      : MEDVEDEV_FIRST_TRIMESTER_SOURCE;

  return (
    <div
      className={cn(
        "rounded-xl border border-indigo-200/80 bg-indigo-50/50 p-3 dark:border-indigo-900/40 dark:bg-indigo-950/20",
        compact ? "space-y-2" : "space-y-3",
      )}
    >
      <p className="text-xs font-bold text-indigo-950 dark:text-indigo-100">{title}</p>
      <ul className={cn("space-y-2", compact ? "text-xs" : "text-sm")}>
        {rows.map((m) => (
          <li
            key={m.key}
            className={cn(
              "rounded-lg px-2 py-1.5",
              m.flag === "high" && "bg-red-100/80 text-red-950 dark:bg-red-950/30 dark:text-red-100",
              m.flag === "low" && "bg-amber-100/80 text-amber-950 dark:bg-amber-950/30 dark:text-amber-100",
              m.flag === "normal" && "bg-emerald-100/60 text-emerald-950 dark:bg-emerald-950/20 dark:text-emerald-100",
              (m.flag === "unknown" || m.flag === "out_of_range") &&
                "bg-[var(--clinical-muted)] text-[var(--clinical-foreground-muted)]",
            )}
          >
            <span className="font-semibold">{m.label}</span>
            {m.percentile !== undefined ? (
              <span className="ml-2 font-bold">~{m.percentile}-й перц.</span>
            ) : null}
            <p className="mt-0.5 leading-snug opacity-90">{m.summary}</p>
            {teachMode ? (
              <div className="mt-2">
                <MedvedevMarkerTeachInline marker={m.key} week={week} />
              </div>
            ) : null}
          </li>
        ))}
      </ul>
      {!compact ? <p className="text-[10px] text-[var(--clinical-foreground-muted)]">{sourceNote}</p> : null}
    </div>
  );
}

function FieldBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-wide text-[var(--clinical-foreground-muted)]">{label}</label>
      {children}
    </div>
  );
}
