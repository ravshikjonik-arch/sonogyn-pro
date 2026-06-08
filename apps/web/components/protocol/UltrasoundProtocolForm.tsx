"use client";

import type { UltrasoundProtocolPayload } from "@repo/types";
import {
  calculateAfi,
  combinedGaDaysFromBiometry,
  estimateFetalWeight,
  estimateFetalWeightAll,
  formatGestationalAge,
  gaDaysFromCrlMm,
  gaDaysFromLmp,
  growthPercentile,
  interpretAfiRu,
  screeningHintsRu,
  toMillimetres,
  validateBiometryMm,
  validateBpdVsGa,
  validateEfwGrams,
  validateLmpBeforeStudy,
  type BiometryKind,
  type LengthUnit,
} from "@repo/medical-calculations";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { NosologyPickerModal, type NosologyProtocolInsert } from "@/components/nosology/NosologyPickerModal";
import { FieldHelpPopover } from "@/components/reference/FieldHelpPopover";
import { UterusVisualizationModal } from "@/components/uterus/UterusVisualizationModal";
import { getSeedNosologies, searchNosologies } from "@repo/nosology";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { buildStudyReportHtml } from "@/lib/reporting/generateStudyPdf";
import { encryptJson } from "@/lib/security/encryptedStorage";
import { cn } from "@/lib/utils/cn";

const BIOMETRY_FIELDS: { key: keyof UltrasoundProtocolPayload["biometry"]; label: string; kind: BiometryKind | "CRL" }[] = [
  { key: "crl_mm", label: "КТР", kind: "CRL" },
  { key: "nt_mm", label: "ТВП", kind: "CRL" },
  { key: "bpd_mm", label: "БПР", kind: "BPD" },
  { key: "hc_mm", label: "ОГ", kind: "HC" },
  { key: "ac_mm", label: "ОЖ", kind: "AC" },
  { key: "fl_mm", label: "ДБ", kind: "FL" },
  { key: "hl_mm", label: "ДП", kind: "HL" },
];

const emptyProtocol = (): UltrasoundProtocolPayload => ({
  study_date: new Date().toISOString().slice(0, 10),
  biometry: {},
  doppler: {},
  amniotic: {},
  organs: {},
  diagnosis: "",
  conclusion: "",
});

type Props = {
  studyId: string;
  patientLabel: string;
  studyTitle: string;
  sessionSeed: string;
  physicianName?: string;
};

export function UltrasoundProtocolForm({
  studyId,
  patientLabel,
  studyTitle,
  sessionSeed,
  physicianName,
}: Props) {
  const [unit, setUnit] = useState<LengthUnit>("mm");
  const [protocol, setProtocol] = useState<UltrasoundProtocolPayload>(emptyProtocol);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uterus3dOpen, setUterus3dOpen] = useState(false);
  const [nosologyOpen, setNosologyOpen] = useState(false);
  const [diagnosisSuggest, setDiagnosisSuggest] = useState<string[]>([]);
  const loadProtocol = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/studies/${studyId}/protocol`);
      const json = (await res.json()) as { protocol: UltrasoundProtocolPayload | null };
      if (json.protocol) {
        setProtocol({ ...emptyProtocol(), ...json.protocol });
      }
    } finally {
      setLoading(false);
    }
  }, [studyId]);

  useEffect(() => {
    void loadProtocol();
  }, [loadProtocol]);

  useEffect(() => {
    if (loading) return;
    try {
      const raw = sessionStorage.getItem("nosology-pending-apply");
      if (!raw) return;
      const pending = JSON.parse(raw) as NosologyProtocolInsert;
      sessionStorage.removeItem("nosology-pending-apply");
      setProtocol((p) => ({
        ...p,
        diagnosis: p.diagnosis?.trim()
          ? `${p.diagnosis}\n${pending.diagnosis}`
          : pending.diagnosis,
        conclusion: p.conclusion?.trim()
          ? `${p.conclusion}\n\n${pending.conclusion}`
          : pending.conclusion,
      }));
      toast.success("Текст из справочника нозологий добавлен в протокол");
    } catch {
      /* ignore malformed */
    }
  }, [loading]);

  const onNosologyInsert = useCallback((payload: NosologyProtocolInsert) => {
    setProtocol((p) => ({
      ...p,
      diagnosis: p.diagnosis?.trim() ? `${p.diagnosis}\n${payload.diagnosis}` : payload.diagnosis,
      conclusion: p.conclusion?.trim() ? `${p.conclusion}\n\n${payload.conclusion}` : payload.conclusion,
    }));
    toast.success("Нозология вставлена в протокол");
  }, []);

  const computedGaDays = useMemo(() => {
    if (protocol.ga_days != null) return protocol.ga_days;
    if (protocol.lmp && protocol.study_date) {
      return gaDaysFromLmp(new Date(protocol.lmp), new Date(protocol.study_date));
    }
    const b = protocol.biometry;
    if (b.crl_mm) return gaDaysFromCrlMm(b.crl_mm);
    return combinedGaDaysFromBiometry({
      BPD: b.bpd_mm,
      HC: b.hc_mm,
      FL: b.fl_mm,
      AC: b.ac_mm,
    });
  }, [protocol]);

  const computedEfw = useMemo(
    () =>
      estimateFetalWeight({
        bpdMm: protocol.biometry.bpd_mm,
        hcMm: protocol.biometry.hc_mm,
        acMm: protocol.biometry.ac_mm,
        flMm: protocol.biometry.fl_mm,
      }),
    [protocol.biometry],
  );

  const warnings = useMemo(() => {
    const msgs: { severity: string; message: string }[] = [];
    const b = protocol.biometry;
    for (const f of BIOMETRY_FIELDS) {
      if (f.key === "nt_mm") continue;
      const v = b[f.key];
      if (v != null) {
        const w = validateBiometryMm(f.kind, v);
        if (w) msgs.push(w);
      }
    }
    if (protocol.lmp && protocol.study_date) {
      const w = validateLmpBeforeStudy(new Date(protocol.lmp), new Date(protocol.study_date));
      if (w) msgs.push(w);
    }
    const ga = computedGaDays;
    if (ga != null && b.bpd_mm) {
      const w = validateBpdVsGa(b.bpd_mm, ga);
      if (w) msgs.push(w);
    }
    if (computedEfw && ga != null) {
      const w = validateEfwGrams(computedEfw.grams, ga);
      if (w) msgs.push(w);
    }
    return msgs;
  }, [protocol, computedGaDays, computedEfw]);

  const efwAll = useMemo(
    () =>
      estimateFetalWeightAll({
        bpdMm: protocol.biometry.bpd_mm,
        hcMm: protocol.biometry.hc_mm,
        acMm: protocol.biometry.ac_mm,
        flMm: protocol.biometry.fl_mm,
      }),
    [protocol.biometry],
  );

  const afi = useMemo(() => {
    const a = protocol.amniotic;
    if (
      a.afi_q1_cm != null &&
      a.afi_q2_cm != null &&
      a.afi_q3_cm != null &&
      a.afi_q4_cm != null
    ) {
      return calculateAfi([a.afi_q1_cm, a.afi_q2_cm, a.afi_q3_cm, a.afi_q4_cm]);
    }
    return null;
  }, [protocol.amniotic]);

  const screeningHints = computedGaDays != null ? screeningHintsRu(computedGaDays) : [];

  async function save() {
    setSaving(true);
    try {
      const payload: UltrasoundProtocolPayload = {
        ...protocol,
        ga_days: computedGaDays ?? undefined,
        efw_grams: computedEfw?.grams,
        efw_formula: computedEfw?.label,
      };
      const res = await fetch(`/api/studies/${studyId}/protocol`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        toast.error("Не удалось сохранить протокол");
        return;
      }
      toast.success("Протокол сохранён");
      const draftKey = `protocol-draft-${studyId}`;
      localStorage.removeItem(draftKey);
    } finally {
      setSaving(false);
    }
  }

  async function saveEncryptedDraft() {
    const encrypted = await encryptJson(sessionSeed, protocol);
    localStorage.setItem(`protocol-draft-${studyId}`, encrypted);
    toast.success("Черновик зашифрован локально");
  }

  function printPdf() {
    const html = buildStudyReportHtml({
      clinicName: "Клиника УЗИ (логотип)",
      patientLabel,
      studyTitle,
      studyDate: protocol.study_date,
      physicianName,
      protocol: {
        ...protocol,
        ga_days: computedGaDays ?? undefined,
        efw_grams: computedEfw?.grams,
        efw_formula: computedEfw?.label,
      },
    });
    const w = window.open("", "_blank");
    if (!w) {
      toast.error("Разрешите всплывающие окна для печати PDF");
      return;
    }
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        void save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function setBiometry(key: keyof UltrasoundProtocolPayload["biometry"], raw: string) {
    const num = parseFloat(raw.replace(",", "."));
    setProtocol((p) => ({
      ...p,
      biometry: {
        ...p.biometry,
        [key]: Number.isFinite(num) && num > 0 ? Math.round(toMillimetres(num, unit)) : undefined,
      },
    }));
  }

  function displayValue(mm?: number): string {
    if (mm == null) return "";
    return unit === "cm" ? String(mm / 10) : String(mm);
  }

  if (loading) {
    return <p className="text-sm text-[var(--clinical-foreground-muted)]">Загрузка протокола…</p>;
  }

  const gaWeeks = computedGaDays != null ? computedGaDays / 7 : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" variant={unit === "mm" ? "default" : "secondary"} onClick={() => setUnit("mm")}>
          мм
        </Button>
        <Button type="button" size="sm" variant={unit === "cm" ? "default" : "secondary"} onClick={() => setUnit("cm")}>
          см
        </Button>
        <span className="text-xs text-[var(--clinical-foreground-muted)]">Ctrl+S — сохранить</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" onClick={() => void saveEncryptedDraft()}>
            Черновик (шифр.)
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={printPdf}>
            PDF / Печать
          </Button>
          <Button type="button" size="sm" onClick={() => void save()} disabled={saving}>
            {saving ? "Сохранение…" : "Сохранить"}
          </Button>
        </div>
      </div>

      {warnings.length > 0 ? (
        <ul className="space-y-1 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          {warnings.map((w, i) => (
            <li key={i} className={cn(w.severity === "critical" && "font-semibold text-red-400")}>
              {w.message}
            </li>
          ))}
        </ul>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="font-semibold">Дата исследования</span>
          <Input
            type="date"
            className="mt-1"
            value={protocol.study_date}
            onChange={(e) => setProtocol((p) => ({ ...p, study_date: e.target.value }))}
          />
        </label>
        <label className="block text-sm">
          <span className="flex items-center gap-1 font-semibold">
            ПМП
            <FieldHelpPopover fieldName="lmp" label="ПМП / расчёт срока" />
          </span>
          <Input
            type="date"
            className="mt-1"
            value={protocol.lmp ?? ""}
            onChange={(e) => setProtocol((p) => ({ ...p, lmp: e.target.value || undefined }))}
          />
        </label>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
          Фетометрия
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BIOMETRY_FIELDS.map((f) => (
            <label key={f.key} className="block text-sm">
              <span className="flex items-center gap-1 font-medium">
                {f.label}
                <FieldHelpPopover fieldName={f.key} label={f.label} />
              </span>
              <Input
                inputMode="decimal"
                className="mt-1 font-mono text-lg"
                placeholder={unit === "mm" ? "мм" : "см"}
                value={displayValue(protocol.biometry[f.key])}
                onChange={(e) => setBiometry(f.key, e.target.value)}
              />
            </label>
          ))}
        </div>
        <div className="mt-4 grid gap-2 rounded-xl bg-[var(--clinical-muted)] p-4 text-sm md:grid-cols-2">
          <p>
            <strong>Срок:</strong> {formatGestationalAge(computedGaDays)}
          </p>
          {computedEfw ? (
            <p>
              <strong>EFW:</strong> {computedEfw.grams} г — {computedEfw.label}
            </p>
          ) : null}
          {gaWeeks != null && protocol.biometry.bpd_mm ? (
            <p>
              <strong>БПР перцентиль:</strong> ~{growthPercentile("bpd", protocol.biometry.bpd_mm, gaWeeks)}%
            </p>
          ) : null}
          {gaWeeks != null && protocol.biometry.hc_mm ? (
            <p>
              <strong>ОГ перцентиль:</strong> ~{growthPercentile("hc", protocol.biometry.hc_mm, gaWeeks)}%
            </p>
          ) : null}
          {gaWeeks != null && protocol.biometry.ac_mm ? (
            <p>
              <strong>ОЖ перцентиль:</strong> ~{growthPercentile("ac", protocol.biometry.ac_mm, gaWeeks)}%
            </p>
          ) : null}
          {gaWeeks != null && protocol.biometry.fl_mm ? (
            <p>
              <strong>ДБ перцентиль:</strong> ~{growthPercentile("fl", protocol.biometry.fl_mm, gaWeeks)}%
            </p>
          ) : null}
          {gaWeeks != null && computedEfw ? (
            <p>
              <strong>EFW перцентиль:</strong> ~{growthPercentile("efw", computedEfw.grams, gaWeeks)}%
            </p>
          ) : null}
        </div>
        {efwAll.length > 1 ? (
          <ul className="mt-2 text-xs text-[var(--clinical-foreground-muted)]">
            {efwAll.map((r) => (
              <li key={r.formula}>
                {r.label}: {r.grams} г
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-1 text-sm font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
          Амниотическая жидкость (AFI)
          <FieldHelpPopover fieldName="afi" label="АФИ / плацента" />
        </h3>
        <div className="grid gap-3 sm:grid-cols-4">
          {(["afi_q1_cm", "afi_q2_cm", "afi_q3_cm", "afi_q4_cm"] as const).map((k, i) => (
            <label key={k} className="text-sm">
              Q{i + 1} (см)
              <Input
                inputMode="decimal"
                className="mt-1"
                value={protocol.amniotic[k] ?? ""}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setProtocol((p) => ({
                    ...p,
                    amniotic: { ...p.amniotic, [k]: Number.isFinite(v) ? v : undefined },
                  }));
                }}
              />
            </label>
          ))}
        </div>
        {afi != null ? <p className="mt-2 text-sm">{interpretAfiRu(afi)} (AFI = {afi} см)</p> : null}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
          Допплер (ПСВ/КДС, см/с)
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <DopplerField
            label="Пуповина PI"
            fieldName="doppler.ua_pi"
            value={protocol.doppler.ua_pi}
            onChange={(v) => setProtocol((p) => ({ ...p, doppler: { ...p.doppler, ua_pi: v } }))}
          />
          <DopplerField
            label="Пуповина RI"
            fieldName="doppler.ua_ri"
            value={protocol.doppler.ua_ri}
            onChange={(v) => setProtocol((p) => ({ ...p, doppler: { ...p.doppler, ua_ri: v } }))}
          />
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
          Органы / описание
        </h3>
        <div className="grid gap-3">
          {(
            [
              ["uterus", "Матка"],
              ["ovaries", "Яичники"],
              ["cervix", "Шейка"],
              ["placenta", "Плацента"],
              ["fetus", "Плод"],
              ["bladder", "Мочевой пузырь"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-sm">
              <span className="flex flex-wrap items-center gap-2 font-medium">
                {label}
                {key === "uterus" ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setUterus3dOpen(true)}
                  >
                    Срез матки
                  </Button>
                ) : null}
              </span>
              <textarea
                className="mt-1 w-full rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-3 text-sm"
                rows={2}
                value={protocol.organs[key] ?? ""}
                onChange={(e) =>
                  setProtocol((p) => ({
                    ...p,
                    organs: { ...p.organs, [key]: e.target.value },
                  }))
                }
              />
            </label>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
          Диагноз / предварительный диагноз
        </h3>
        <div className="relative">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => setNosologyOpen(true)}>
              📋 Нозологии
            </Button>
            <Button type="button" size="sm" variant="ghost" asChild>
              <a href={`/nosologies?studyId=${studyId}`}>Открыть справочник</a>
            </Button>
          </div>
          <Input
            className="w-full"
            value={protocol.diagnosis ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              setProtocol((p) => ({ ...p, diagnosis: v }));
              const hits = searchNosologies(getSeedNosologies(), v, 6);
              setDiagnosisSuggest(hits.map((h) => h.title));
            }}
            placeholder="Начните вводить название заболевания…"
            list="nosology-suggest"
          />
          {diagnosisSuggest.length > 0 ? (
            <datalist id="nosology-suggest">
              {diagnosisSuggest.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          ) : null}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
          Заключение
        </h3>
        <textarea
          className="w-full rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-3 text-sm"
          rows={4}
          value={protocol.conclusion ?? ""}
          onChange={(e) => setProtocol((p) => ({ ...p, conclusion: e.target.value }))}
          placeholder="Текст заключения врача…"
        />
      </section>

      {screeningHints.length > 0 ? (
        <section className="rounded-xl border border-[var(--clinical-border)] p-4">
          <h3 className="text-sm font-bold">Напоминания о скринингах</h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-[var(--clinical-foreground-muted)]">
            {screeningHints.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {protocol.uterus_visualization?.snapshotDataUrl ? (
        <section className="rounded-xl border border-[var(--clinical-border)] p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
            Схема матки (3D)
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={protocol.uterus_visualization.snapshotDataUrl}
            alt="Схема матки"
            className="max-h-48 rounded-lg border border-[var(--clinical-border)] object-contain"
          />
        </section>
      ) : null}

      <NosologyPickerModal
        open={nosologyOpen}
        onClose={() => setNosologyOpen(false)}
        studyId={studyId}
        onInsert={onNosologyInsert}
      />

      <UterusVisualizationModal
        open={uterus3dOpen}
        onClose={() => setUterus3dOpen(false)}
        initial={protocol.uterus_visualization}
        onApply={({ protocolText, state }) => {
          setProtocol((p) => {
            const prev = p.organs.uterus?.trim();
            const merged = prev ? `${prev}\n\n${protocolText}` : protocolText;
            return {
              ...p,
              organs: { ...p.organs, uterus: merged },
              uterus_visualization: state,
            };
          });
        }}
      />
    </div>
  );
}

function DopplerField({
  label,
  fieldName,
  value,
  onChange,
}: {
  label: string;
  fieldName?: string;
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <label className="text-sm">
      <span className="flex items-center gap-1">
        {label}
        {fieldName ? <FieldHelpPopover fieldName={fieldName} label={label} /> : null}
      </span>
      <Input
        inputMode="decimal"
        className="mt-1"
        placeholder="PI / RI"
        value={value ?? ""}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          onChange(Number.isFinite(v) ? v : undefined);
        }}
      />
    </label>
  );
}
