"use client";

import {
  deleteNosology,
  exportNosologiesJson,
  getAllNosologies,
  importNosologiesJson,
  upsertNosology,
  type Nosology,
  type NosologyZone,
} from "@repo/nosology";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ZONES: NosologyZone[] = ["uterus", "endometrium", "ovaries", "tubes", "cervix", "other"];

const emptyForm = (): Nosology => ({
  id: "",
  title: "",
  zone: "uterus",
  keywords: [],
  description: "",
  examinationScheme: {},
  diagnostics: {},
  treatment: {},
  guidelines: {},
  diagnosisLine: "",
  protocolTemplate: "",
});

type Props = { initialEditId?: string | null };

export function NosologyAdminClient({ initialEditId }: Props) {
  const [list, setList] = useState<Nosology[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Nosology>(emptyForm());
  const [keywordsText, setKeywordsText] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getAllNosologies();
      setList(all);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!initialEditId || list.length === 0) return;
    const n = list.find((x) => x.id === initialEditId);
    if (n) {
      setForm(n);
      setKeywordsText(n.keywords.join(", "));
    }
  }, [initialEditId, list]);

  const save = async () => {
    try {
      const id = form.id.trim() || `nosology-${Date.now()}`;
      const payload: Nosology = {
        ...form,
        id,
        keywords: keywordsText.split(",").map((k) => k.trim()).filter(Boolean),
        diagnosisLine: form.diagnosisLine || form.title,
        protocolTemplate: form.protocolTemplate || form.description,
      };
      await upsertNosology(payload);
      toast.success("Сохранено");
      setForm(emptyForm());
      setKeywordsText("");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка сохранения");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Удалить нозологию?")) return;
    try {
      await deleteNosology(id);
      toast.success("Удалено");
      await reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    }
  };

  const blockField = (
    key: keyof Pick<Nosology, "examinationScheme" | "diagnostics" | "treatment" | "guidelines">,
    label: string,
  ) => (
    <label className="block text-sm">
      {label} (пункты через перевод строки)
      <textarea
        className="mt-1 w-full rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-muted)] p-2 font-mono text-xs"
        rows={4}
        value={(form[key].bullets ?? []).join("\n")}
        onChange={(e) =>
          setForm((f) => ({
            ...f,
            [key]: { ...f[key], bullets: e.target.value.split("\n").filter(Boolean) },
          }))
        }
      />
    </label>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold">Администрирование нозологий</h1>
        <p className="text-sm text-[var(--clinical-foreground-muted)]">
          Изменения сохраняются в IndexedDB на этом устройстве. Экспортируйте JSON для коллег.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={async () => {
            const json = await exportNosologiesJson();
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "nosologies-export.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Экспорт JSON
        </Button>
        <label className="inline-flex cursor-pointer items-center">
          <Button type="button" variant="secondary" asChild>
            <span>Импорт JSON</span>
          </Button>
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const text = await file.text();
                const n = await importNosologiesJson(text);
                toast.success(`Импортировано: ${n}`);
                await reload();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Ошибка импорта");
              }
            }}
          />
        </label>
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-[var(--clinical-border)] p-4">
          <h2 className="font-semibold">{form.id ? "Редактирование" : "Новая нозология"}</h2>
          <Input placeholder="id (латиница)" value={form.id} onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} />
          <Input placeholder="Название" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          <select
            className="w-full rounded-lg border border-[var(--clinical-border)] bg-[var(--clinical-muted)] p-2"
            value={form.zone}
            onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value as NosologyZone }))}
          >
            {ZONES.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
          <Input placeholder="МКБ-10" value={form.icd10 ?? ""} onChange={(e) => setForm((f) => ({ ...f, icd10: e.target.value }))} />
          <textarea
            className="w-full rounded-lg border p-2 text-sm"
            rows={2}
            placeholder="Краткое описание"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <Input
            placeholder="Ключевые слова через запятую"
            value={keywordsText}
            onChange={(e) => setKeywordsText(e.target.value)}
          />
          <Input
            placeholder="Строка диагноза"
            value={form.diagnosisLine}
            onChange={(e) => setForm((f) => ({ ...f, diagnosisLine: e.target.value }))}
          />
          <textarea
            className="w-full rounded-lg border p-2 font-mono text-xs"
            rows={3}
            placeholder="Шаблон протокола {размер} {локализация}"
            value={form.protocolTemplate}
            onChange={(e) => setForm((f) => ({ ...f, protocolTemplate: e.target.value }))}
          />
          {blockField("examinationScheme", "Обследование")}
          {blockField("diagnostics", "Диагностика")}
          {blockField("treatment", "Лечение")}
          {blockField("guidelines", "Рекомендации")}
          <div className="flex gap-2">
            <Button type="button" onClick={() => void save()}>
              Сохранить
            </Button>
            <Button type="button" variant="ghost" onClick={() => { setForm(emptyForm()); setKeywordsText(""); }}>
              Сброс
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[var(--clinical-border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--clinical-muted)]">
              <tr>
                <th className="p-2">Название</th>
                <th className="p-2">Зона</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="p-4 text-center opacity-60">
                    Загрузка…
                  </td>
                </tr>
              ) : (
                list.map((n) => (
                  <tr key={n.id} className="border-t border-[var(--clinical-border)]">
                    <td className="p-2">{n.title}</td>
                    <td className="p-2 text-xs">{n.zone}</td>
                    <td className="p-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => { setForm(n); setKeywordsText(n.keywords.join(", ")); }}>
                        Изм.
                      </Button>
                      <Button type="button" size="sm" variant="destructive" className="ml-1" onClick={() => void remove(n.id)}>
                        ×
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
