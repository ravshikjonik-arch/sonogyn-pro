"use client";

import {
  buildProtocolInsertion,
  getNosologyNotes,
  isFavoriteNosology,
  pushRecentNosology,
  saveNosologyNotes,
  toggleFavoriteNosology,
  type Nosology,
} from "@repo/nosology";
import { ArrowLeft, ClipboardList, Printer, Star } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { NosologySectionView } from "@/components/nosology/NosologySectionView";
import { PdfSourcePanel } from "@/components/nosology/PdfSourcePanel";
import { ClinicalAssistStrip } from "@/components/clinical-assistant/ClinicalAssistStrip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNosologyDetail } from "@/hooks/useNosologies";
import { nosologyAssistContextFromNosology } from "@/lib/clinical-assistant/nosology-assist-context";
import { cn } from "@/lib/utils/cn";

const TAB_SECTIONS = [
  { id: "exam", label: "Обследование", key: "examinationScheme" as const },
  { id: "dx", label: "Диагностика", key: "diagnostics" as const },
  { id: "tx", label: "Лечение", key: "treatment" as const },
  { id: "guide", label: "Рекомендации", key: "guidelines" as const },
  { id: "pdf", label: "Первоисточник", key: null },
];

type Props = {
  id: string;
  isAdmin?: boolean;
};

export function NosologyDetailClient({ id, isAdmin }: Props) {
  const { nosology, loading, error } = useNosologyDetail(id);
  const router = useRouter();
  const searchParams = useSearchParams();
  const studyId = searchParams.get("studyId");
  const [favorite, setFavorite] = useState(false);
  const [notes, setNotes] = useState("");
  const [sizeMm, setSizeMm] = useState("");
  const [localization, setLocalization] = useState("");

  useEffect(() => {
    if (nosology) {
      pushRecentNosology(nosology.id);
      setFavorite(isFavoriteNosology(nosology.id));
      setNotes(getNosologyNotes(nosology.id));
    }
  }, [nosology]);

  const persistNotes = useCallback(() => {
    if (!nosology) return;
    saveNosologyNotes(nosology.id, notes);
    toast.success("Заметки сохранены");
  }, [nosology, notes]);

  const applyToProtocol = useCallback(
    (n: Nosology) => {
      const { diagnosis, conclusion } = buildProtocolInsertion(n.diagnosisLine, n.protocolTemplate, {
        размер: sizeMm || "—",
        локализация: localization || "не уточнена",
        степень: "не оценена",
      });

      if (studyId) {
        sessionStorage.setItem(
          "nosology-pending-apply",
          JSON.stringify({ diagnosis, conclusion, nosologyId: n.id }),
        );
        router.push(`/workspace/${studyId}`);
        toast.success("Переход к протоколу с вставкой текста");
        return;
      }

      void navigator.clipboard.writeText(`${diagnosis}\n\n${conclusion}`);
      toast.success("Текст скопирован в буфер обмена (откройте протокол пациентки)");
    },
    [studyId, sizeMm, localization, router],
  );

  const printMemo = useCallback((n: Nosology) => {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${n.title}</title>
      <style>body{font-family:system-ui,sans-serif;padding:24px;max-width:720px;line-height:1.5}
      h1{font-size:20px}h2{font-size:14px;margin-top:20px;color:#444}ul{padding-left:20px}</style></head><body>
      <h1>${n.title}</h1><p>${n.description}</p>
      <h2>Обследование</h2><ul>${(n.examinationScheme.checklist ?? n.examinationScheme.bullets ?? []).map((x) => `<li>${x}</li>`).join("")}</ul>
      <h2>Диагностика</h2><ul>${(n.diagnostics.bullets ?? []).map((x) => `<li>${x}</li>`).join("")}</ul>
      <h2>Лечение</h2><ul>${(n.treatment.bullets ?? []).map((x) => `<li>${x}</li>`).join("")}</ul>
      </body></html>`;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.print();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 p-6">
        <div className="h-10 w-2/3 animate-pulse rounded-lg bg-[var(--clinical-muted)]" />
        <div className="h-64 animate-pulse rounded-xl bg-[var(--clinical-muted)]" />
      </div>
    );
  }

  if (error || !nosology) {
    return (
      <div className="mx-auto max-w-lg p-10 text-center">
        <p className="text-lg font-semibold">{error ?? "Не найдено"}</p>
        <Button className="mt-4" asChild>
          <Link href="/nosologies">К списку</Link>
        </Button>
      </div>
    );
  }

  const assistContext = nosologyAssistContextFromNosology(nosology);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 lg:px-8">
      <div className="flex flex-wrap items-start gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={studyId ? `/workspace/${studyId}` : "/nosologies"}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            {studyId ? "К протоколу" : "Назад"}
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{nosology.title}</h1>
          {nosology.icd10 ? (
            <p className="text-sm text-[var(--clinical-foreground-muted)]">МКБ-10: {nosology.icd10}</p>
          ) : null}
          <p className="mt-2 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]">
            {nosology.description.split(/(\/(?:reference|assistant|nosologies)[^\s)\],]+)/g).map((part, i) => {
              if (!part.startsWith("/")) return part;
              const label = part.includes("/norms") ? "Нормы Медведева" : part.includes("/assistant") ? "Ассистент" : "Ссылка";
              return (
                <Link key={`desc-${i}`} href={part} className="font-semibold text-[var(--clinical-primary)] underline">
                  {label}
                </Link>
              );
            })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              const f = toggleFavoriteNosology(nosology.id);
              setFavorite(f);
            }}
            title="В избранное"
          >
            <Star className={cn("h-4 w-4", favorite && "fill-amber-400 text-amber-500")} />
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => printMemo(nosology)}>
            <Printer className="mr-1 h-4 w-4" />
            Печать
          </Button>
          <Button type="button" size="sm" onClick={() => applyToProtocol(nosology)}>
            <ClipboardList className="mr-1 h-4 w-4" />
            В протокол
          </Button>
          {isAdmin ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/nosologies?edit=${nosology.id}`}>Редактировать</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <ClinicalAssistStrip
        context={assistContext}
        onApplyProtocol={(text) => {
          void navigator.clipboard.writeText(text);
          toast.success("Черновик ИИ скопирован — вставьте в протокол");
        }}
      />

      <div className="grid gap-4 rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-4 md:grid-cols-3">
        <label className="text-sm">
          Размер (мм) для шаблона
          <Input className="mt-1" value={sizeMm} onChange={(e) => setSizeMm(e.target.value)} placeholder="42" />
        </label>
        <label className="text-sm md:col-span-2">
          Локализация
          <Input
            className="mt-1"
            value={localization}
            onChange={(e) => setLocalization(e.target.value)}
            placeholder="по передней стенке тела матки"
          />
        </label>
      </div>

      <label className="block text-sm">
        Мои заметки
        <textarea
          className="mt-1 w-full rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-muted)] p-3 text-sm"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={persistNotes}
          placeholder="Личные пометки (видны только на этом устройстве)…"
        />
      </label>

      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <Tabs defaultValue="exam" className="min-w-0">
          <TabsList className="flex h-auto flex-wrap gap-1 bg-[var(--clinical-muted)] p-1">
            {TAB_SECTIONS.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="text-xs sm:text-sm">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {TAB_SECTIONS.filter((t) => t.key).map((t) => (
            <TabsContent key={t.id} value={t.id} className="mt-4">
              <NosologySectionView block={nosology[t.key!]} />
            </TabsContent>
          ))}
          <TabsContent value="pdf" className="mt-4 lg:hidden">
            <PdfSourcePanel nosology={nosology} />
          </TabsContent>
        </Tabs>
        <div className="hidden lg:block">
          <PdfSourcePanel nosology={nosology} />
        </div>
      </div>
    </div>
  );
}
