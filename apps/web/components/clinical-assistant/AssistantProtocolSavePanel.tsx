"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { saveAssistantRouteToPatient } from "@/app/actions/assistant-protocol-actions";
import { buildAssistantProtocolText } from "@/lib/clinical-assistant/build-protocol";
import { assistantCardToDocumentSpec } from "@/lib/reporting/document-spec-builders";
import type { ObgynNosologyCard } from "@/lib/clinical-assistant";
import { DocumentExportToolbar } from "@/components/reporting/DocumentExportToolbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type PatientRow = { id: string; display_label: string };
type StudyRow = { id: string; title: string | null; study_type: string; created_at: string };

type Props = {
  card: ObgynNosologyCard | undefined;
  initialPatientId?: string;
};

export function AssistantProtocolSavePanel({ card, initialPatientId }: Props) {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [studies, setStudies] = useState<StudyRow[]>([]);
  const [patientId, setPatientId] = useState(initialPatientId ?? "");
  const [studyId, setStudyId] = useState("");
  const [patientQuery, setPatientQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const protocolText = useMemo(() => (card ? buildAssistantProtocolText(card) : ""), [card]);
  const exportSpec = useMemo(() => (card ? assistantCardToDocumentSpec(card) : null), [card]);

  const loadPatients = useCallback(async (q: string) => {
    const res = await fetch(`/api/patients?q=${encodeURIComponent(q)}`);
    if (!res.ok) return;
    const json = (await res.json()) as { patients: PatientRow[] };
    setPatients(json.patients ?? []);
  }, []);

  useEffect(() => {
    void loadPatients(patientQuery);
  }, [patientQuery, loadPatients]);

  useEffect(() => {
    if (!patientId) {
      setStudies([]);
      setStudyId("");
      return;
    }
    void (async () => {
      const res = await fetch(`/api/patients/${patientId}/studies`);
      if (!res.ok) return;
      const json = (await res.json()) as { studies: StudyRow[] };
      setStudies(json.studies ?? []);
      if (json.studies?.[0]) setStudyId(json.studies[0].id);
    })();
  }, [patientId]);

  function onSave() {
    if (!card || !patientId) {
      toast.error("Выберите пациентку и нозологию");
      return;
    }
    startTransition(() => {
      void saveAssistantRouteToPatient({
        patientId,
        studyId: studyId || undefined,
        text: protocolText,
      }).then((res) => {
        if (!res.ok) {
          toast.error(res.message);
          return;
        }
        if (res.studyId) {
          toast.success("Маршрут добавлен в протокол исследования");
        } else {
          toast.success("Сохранено в карте пациентки (нет исследований — создайте визит в workspace)");
        }
      });
    });
  }

  return (
    <div className="sonogyn-glass-card space-y-4 rounded-2xl border border-emerald-200/80 p-4">
      <div>
        <p className="text-sm font-black text-emerald-900 dark:text-emerald-200">Сохранить в протокол пациентки</p>
        <p className="mt-1 text-xs text-[var(--clinical-foreground-muted)]">
          Текст маршрута добавится в поле «Заключение» протокола УЗИ выбранного исследования. Если исследований нет —
          в метаданные карты.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-bold">Поиск пациентки</label>
          <Input
            className="mt-1"
            placeholder="ФИО / метка"
            value={patientQuery}
            onChange={(e) => setPatientQuery(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-bold">Пациентка</label>
          <select
            className="mt-1 w-full rounded-lg border border-[var(--clinical-border)] bg-white px-3 py-2 text-sm dark:bg-slate-900"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
          >
            <option value="">— выберите —</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_label}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-bold">Исследование (опционально)</label>
          <select
            className="mt-1 w-full rounded-lg border border-[var(--clinical-border)] bg-white px-3 py-2 text-sm dark:bg-slate-900"
            value={studyId}
            onChange={(e) => setStudyId(e.target.value)}
            disabled={!patientId || studies.length === 0}
          >
            <option value="">Последнее исследование автоматически</option>
            {studies.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title ?? s.study_type} · {new Date(s.created_at).toLocaleDateString("ru-RU")}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={pending || !card} onClick={onSave}>
          {pending ? "Сохранение…" : "В протокол пациентки"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!protocolText}
          onClick={() => void navigator.clipboard.writeText(protocolText)}
        >
          Копировать маршрут
        </Button>
        {patientId && studyId ? (
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/workspace/${studyId}`}>Открыть исследование →</Link>
          </Button>
        ) : null}
      </div>

      <DocumentExportToolbar spec={exportSpec} compact />

      {card ? (
        <pre className="max-h-40 overflow-auto rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed dark:bg-slate-900">
          {protocolText.slice(0, 1200)}
          {protocolText.length > 1200 ? "…" : ""}
        </pre>
      ) : null}
    </div>
  );
}
