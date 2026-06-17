"use client";

import { CalcChip, CalcStepCard, CalcSubLabel } from "@/components/calculators/shared/calc-ui";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ANAMNESIS_GROUPS,
  ANAMNESIS_LABELS,
  CERVIX_SHAPE_LABELS,
  COMPLAINT_LABELS,
  FINDING_LABELS,
  type ColposcopyAnamnesisKey,
  type ColposcopyComplaintKey,
  type ColposcopyFindingKey,
  type ColposcopyProtocolInput,
  type CervixShapeKey,
} from "@/lib/colposcopy";

type Props = {
  value: ColposcopyProtocolInput;
  onChange: (patch: Partial<ColposcopyProtocolInput>) => void;
};

export function ColposcopyProtocolSection({ value, onChange }: Props) {
  function toggleComplaint(key: ColposcopyComplaintKey) {
    const next = value.complaints.includes(key)
      ? value.complaints.filter((c) => c !== key)
      : [...value.complaints, key];
    onChange({ complaints: next });
  }

  function toggleAnamnesis(key: ColposcopyAnamnesisKey) {
    const next = value.anamnesis.includes(key)
      ? value.anamnesis.filter((a) => a !== key)
      : [...value.anamnesis, key];
    onChange({ anamnesis: next });
  }

  function toggleFinding(key: ColposcopyFindingKey) {
    const next = value.findings.includes(key)
      ? value.findings.filter((f) => f !== key)
      : [...value.findings, key];
    onChange({ findings: next });
  }

  return (
    <>
      <CalcStepCard title="1. Пациентка (протокол кольпоскопии)">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-xs font-bold text-[var(--clinical-foreground-muted)] sm:col-span-2">
            Ф.И.О.
            <Input
              value={value.patientName}
              onChange={(e) => onChange({ patientName: e.target.value })}
              placeholder="Иванова А.А."
              className="mt-1"
            />
          </label>
          <label className="block text-xs font-bold text-[var(--clinical-foreground-muted)]">
            Возраст
            <Input
              value={value.patientAge}
              onChange={(e) => onChange({ patientAge: e.target.value })}
              placeholder="45"
              className="mt-1"
            />
          </label>
          <label className="block text-xs font-bold text-[var(--clinical-foreground-muted)] sm:col-span-3">
            ID / № карты (опционально)
            <Input
              value={value.patientId}
              onChange={(e) => onChange({ patientId: e.target.value })}
              className="mt-1"
            />
          </label>
        </div>
      </CalcStepCard>

      <CalcStepCard title="2. Анамнез (по бланку)">
        {ANAMNESIS_GROUPS.map((group) => (
          <div key={group.title} className="mb-3">
            <CalcSubLabel>{group.title}</CalcSubLabel>
            <div className="flex flex-wrap gap-2">
              {group.keys.map((key) => (
                <CalcChip
                  key={key}
                  label={ANAMNESIS_LABELS[key]}
                  selected={value.anamnesis.includes(key)}
                  onClick={() => toggleAnamnesis(key)}
                />
              ))}
            </div>
          </div>
        ))}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-xs font-bold text-[var(--clinical-foreground-muted)]">
            Возраст 1-го ПК
            <Input
              value={value.ageFirstSex}
              onChange={(e) => onChange({ ageFirstSex: e.target.value })}
              className="mt-1"
            />
          </label>
          <label className="block text-xs font-bold text-[var(--clinical-foreground-muted)]">
            Роды
            <Input value={value.births} onChange={(e) => onChange({ births: e.target.value })} className="mt-1" />
          </label>
          <label className="block text-xs font-bold text-[var(--clinical-foreground-muted)]">
            Аборты
            <Input
              value={value.abortions}
              onChange={(e) => onChange({ abortions: e.target.value })}
              className="mt-1"
            />
          </label>
          <label className="block text-xs font-bold text-[var(--clinical-foreground-muted)]">
            Дата последней менструации
            <Input value={value.lmp} onChange={(e) => onChange({ lmp: e.target.value })} className="mt-1" />
          </label>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <CalcChip label="Курит" selected={value.smokes} onClick={() => onChange({ smokes: !value.smokes })} />
          {value.smokes ? (
            <Input
              value={value.cigarettesPerDay}
              onChange={(e) => onChange({ cigarettesPerDay: e.target.value })}
              placeholder="Сигарет в сутки"
              className="max-w-[160px]"
            />
          ) : null}
        </div>
        <Textarea
          rows={2}
          value={value.anamnesisNotes}
          onChange={(e) => onChange({ anamnesisNotes: e.target.value })}
          placeholder="Доп. анамнез, лекарства, ЗГТ…"
          className="mt-2"
        />
      </CalcStepCard>

      <CalcStepCard title="3. Жалобы">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(COMPLAINT_LABELS) as ColposcopyComplaintKey[]).map((key) => (
            <CalcChip
              key={key}
              label={COMPLAINT_LABELS[key]}
              selected={value.complaints.includes(key)}
              onClick={() => toggleComplaint(key)}
            />
          ))}
        </div>
        {value.complaints.includes("other") ? (
          <Input
            value={value.complaintsOther}
            onChange={(e) => onChange({ complaintsOther: e.target.value })}
            placeholder="Другие жалобы…"
            className="mt-2"
          />
        ) : null}
      </CalcStepCard>

      <CalcStepCard title="4. Кольпоскопическое описание">
        <CalcSubLabel>Форма шейки матки</CalcSubLabel>
        <div className="mb-3 flex flex-wrap gap-2">
          {(Object.keys(CERVIX_SHAPE_LABELS) as CervixShapeKey[]).map((key) => (
            <CalcChip
              key={key}
              label={CERVIX_SHAPE_LABELS[key]}
              selected={value.cervixShape === key}
              onClick={() => onChange({ cervixShape: value.cervixShape === key ? "" : key })}
            />
          ))}
        </div>

        <CalcSubLabel>Находки (таблица бланка)</CalcSubLabel>
        <div className="mb-3 flex flex-wrap gap-2">
          {(Object.keys(FINDING_LABELS) as ColposcopyFindingKey[]).map((key) => (
            <CalcChip
              key={key}
              label={FINDING_LABELS[key]}
              selected={value.findings.includes(key)}
              onClick={() => toggleFinding(key)}
            />
          ))}
        </div>

        <CalcSubLabel>Ацетобелый эпителий</CalcSubLabel>
        <div className="mb-3 flex flex-wrap gap-2">
          {(
            [
              ["none", "Нет"],
              ["delicate", "Нежный"],
              ["dense", "Плотный"],
            ] as const
          ).map(([v, label]) => (
            <CalcChip
              key={v}
              label={label}
              selected={value.acetowhiteEpithelium === v}
              onClick={() => onChange({ acetowhiteEpithelium: v })}
            />
          ))}
        </div>

        <CalcSubLabel>Границы аномального эпителия</CalcSubLabel>
        <div className="mb-3 flex flex-wrap gap-2">
          <CalcChip
            label="Чёткие"
            selected={value.marginQuality === "sharp"}
            onClick={() => onChange({ marginQuality: "sharp" })}
          />
          <CalcChip
            label="Нечёткие"
            selected={value.marginQuality === "blurred"}
            onClick={() => onChange({ marginQuality: "blurred" })}
          />
        </div>

        <CalcSubLabel>Йод-негативная зона (ЙНЗ)</CalcSubLabel>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["positive", "Окрашивание есть"],
              ["partial", "Частичное"],
              ["negative", "Полная ЙНЗ"],
            ] as const
          ).map(([v, label]) => (
            <CalcChip
              key={v}
              label={label}
              selected={value.iodineZone === v}
              onClick={() => onChange({ iodineZone: v })}
            />
          ))}
        </div>
      </CalcStepCard>

      <CalcStepCard title="5. Диагнозы и рекомендации">
        <label className="mb-3 block text-xs font-bold text-[var(--clinical-foreground-muted)]">
          Кольпоскопический диагноз
          <Textarea
            rows={2}
            value={value.colposcopicDiagnosis}
            onChange={(e) => onChange({ colposcopicDiagnosis: e.target.value })}
            placeholder="Напр.: ацетобелый эпителий в ЗТ…"
            className="mt-1"
          />
        </label>
        <label className="mb-3 block text-xs font-bold text-[var(--clinical-foreground-muted)]">
          Клинический диагноз
          <Textarea
            rows={2}
            value={value.clinicalDiagnosis}
            onChange={(e) => onChange({ clinicalDiagnosis: e.target.value })}
            className="mt-1"
          />
        </label>
        <label className="block text-xs font-bold text-[var(--clinical-foreground-muted)]">
          Рекомендации
          <Textarea
            rows={2}
            value={value.recommendations}
            onChange={(e) => onChange({ recommendations: e.target.value })}
            className="mt-1"
          />
        </label>
      </CalcStepCard>
    </>
  );
}
