"use client";

import { useCallback, useState } from "react";

import { sourceTypeLabel } from "@repo/medical-knowledge/labels";

type SourceRow = {
  id: string;
  title: string;
  review_status: string;
  source_type: string;
  updated_at?: string;
};

export function SourceStudioClient({ initialSources }: { initialSources: SourceRow[] }) {
  const [sources, setSources] = useState(initialSources);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [licenseNotes, setLicenseNotes] = useState("");
  const [importUrl, setImportUrl] = useState("");
  const [urlTitle, setUrlTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [chunks, setChunks] = useState<
    Array<{ id: string; chunk_index: number; section_title: string | null; contentPreview: string }>
  >([]);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/admin/medical-knowledge/sources");
    const json = (await res.json()) as { sources?: SourceRow[]; error?: string };
    if (res.ok && json.sources) setSources(json.sources);
  }, []);

  async function onIngest(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/medical-knowledge/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          text,
          licenseNotes: licenseNotes || undefined,
          sourceType: "manual",
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        sourceId?: string;
        chunkCount?: number;
        requiresManualReview?: boolean;
      };
      if (!res.ok) {
        setMessage(json.error ?? "Ошибка ingest");
        return;
      }
      setMessage(
        `Создано: ${json.sourceId} · чанков ${json.chunkCount}${
          json.requiresManualReview ? " · нужна ручная проверка sanitize" : ""
        }`,
      );
      setTitle("");
      setText("");
      await refresh();
      if (json.sourceId) void loadChunks(json.sourceId);
    } catch {
      setMessage("Сеть / сервер недоступны");
    } finally {
      setBusy(false);
    }
  }

  async function onIngestUrl(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/medical-knowledge/ingest-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: importUrl.trim(),
          title: urlTitle.trim() || undefined,
          sourceType: "guideline",
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        sourceId?: string;
        chunkCount?: number;
        contentKind?: string;
        nonCommercial?: boolean;
        next?: string;
      };
      if (!res.ok) {
        setMessage(json.error ?? "Ошибка импорта по ссылке");
        return;
      }
      setMessage(
        `Импорт ${json.contentKind ?? "url"}: ${json.sourceId} · чанков ${json.chunkCount}${
          json.nonCommercial ? " · NC — не публиковать в RAG без юр. проверки" : ""
        }${json.next ? ` · ${json.next}` : ""}`,
      );
      setImportUrl("");
      setUrlTitle("");
      await refresh();
      if (json.sourceId) void loadChunks(json.sourceId);
    } catch {
      setMessage("Сеть / сервер недоступны");
    } finally {
      setBusy(false);
    }
  }

  async function loadChunks(id: string) {
    setSelectedId(id);
    const res = await fetch(`/api/admin/medical-knowledge/sources/${id}`);
    const json = (await res.json()) as {
      chunks?: Array<{
        id: string;
        chunk_index: number;
        section_title: string | null;
        contentPreview: string;
      }>;
    };
    setChunks(json.chunks ?? []);
  }

  async function patch(id: string, action: "approve_and_publish" | "reject") {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/medical-knowledge/sources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const json = (await res.json()) as { error?: string; reviewStatus?: string; note?: string };
      if (!res.ok) {
        setMessage(json.error ?? "Ошибка");
        return;
      }
      setMessage(`Статус: ${json.reviewStatus}${json.note ? ` · ${json.note}` : ""}`);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={onIngestUrl} className="space-y-3 rounded-2xl border border-[var(--clinical-border)] p-5">
        <h2 className="text-lg font-semibold">Импорт по ссылке (B1)</h2>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          Только белый список доменов (МЗ / pravo.gov / РАЭ / ВОЗ / ETA…). Скачивает PDF с текстовым слоем
          или HTML → чанки со статусом «на проверке». Сканы без текста — не подойдут. Автопубликации нет.
        </p>
        <label className="block text-sm">
          URL (https)
          <input
            className="mt-1 w-full rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 py-2"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            type="url"
            required
            placeholder="https://…/guideline.pdf"
          />
        </label>
        <label className="block text-sm">
          Название (необязательно)
          <input
            className="mt-1 w-full rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 py-2"
            value={urlTitle}
            onChange={(e) => setUrlTitle(e.target.value)}
            minLength={3}
            placeholder="Если пусто — возьмём из файла/страницы"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-[var(--clinical-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "…" : "Скачать и создать source"}
        </button>
      </form>

      <form onSubmit={onIngest} className="space-y-3 rounded-2xl border border-[var(--clinical-border)] p-5">
        <h2 className="text-lg font-semibold">Ingest текста (не PDF)</h2>
        <p className="text-xs text-[var(--clinical-foreground-muted)]">
          Только материал с понятной лицензией. После ingest — review → Publish. Semantic vault отдельно
          (embed + флаг).
        </p>
        <label className="block text-sm">
          Название
          <input
            className="mt-1 w-full rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={3}
          />
        </label>
        <label className="block text-sm">
          License notes
          <input
            className="mt-1 w-full rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 py-2"
            value={licenseNotes}
            onChange={(e) => setLicenseNotes(e.target.value)}
            placeholder="напр. внутренняя методичка клиники / CC-BY…"
          />
        </label>
        <label className="block text-sm">
          Текст
          <textarea
            className="mt-1 min-h-[160px] w-full rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 py-2 font-mono text-xs"
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
            minLength={40}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-[var(--clinical-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "…" : "Создать source + chunks"}
        </button>
      </form>

      {message ? (
        <p className="rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-muted)]/40 px-4 py-3 text-sm" role="status">
          {message}
        </p>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold">Sources</h2>
        <ul className="mt-3 space-y-2">
          {sources.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--clinical-border)] px-4 py-3 text-sm"
            >
              <button type="button" className="text-left font-medium underline-offset-2 hover:underline" onClick={() => void loadChunks(s.id)}>
                {s.title}
              </button>
              <span className="text-xs text-[var(--clinical-foreground-muted)]">
                {sourceTypeLabel(s.source_type)} · {s.review_status}
              </span>
              <span className="flex gap-2">
                <button
                  type="button"
                  className="rounded-lg border border-[var(--clinical-border)] px-2 py-1 text-xs"
                  disabled={busy || s.review_status === "published"}
                  onClick={() => void patch(s.id, "approve_and_publish")}
                >
                  Publish
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-[var(--clinical-border)] px-2 py-1 text-xs"
                  disabled={busy}
                  onClick={() => void patch(s.id, "reject")}
                >
                  Reject
                </button>
              </span>
            </li>
          ))}
        </ul>
        {sources.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--clinical-foreground-muted)]">Пока пусто или vault migration не на этом проекте.</p>
        ) : null}
      </section>

      {selectedId ? (
        <section>
          <h2 className="text-lg font-semibold">Chunks preview · {selectedId.slice(0, 8)}…</h2>
          <ul className="mt-3 space-y-2">
            {chunks.map((c) => (
              <li key={c.id} className="rounded-xl border border-[var(--clinical-border)] p-3 text-xs">
                <p className="font-semibold">
                  #{c.chunk_index}
                  {c.section_title ? ` · ${c.section_title}` : ""}
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[var(--clinical-foreground-muted)]">{c.contentPreview}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
