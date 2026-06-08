"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { highlightText } from "@/lib/reference/referenceService";
import { cn } from "@/lib/utils/cn";
import { useClinicalReference } from "@/hooks/useClinicalReference";
import type { ClinicalTopic } from "@repo/clinical-reference";

export function ClinicalReferenceReader() {
  const router = useRouter();
  const params = useSearchParams();
  const { index, sections, search, topic } = useClinicalReference();

  const initialTopic = params.get("topic");
  const [activeId, setActiveId] = useState(initialTopic ?? index.topics[0]?.id ?? "");
  const [query, setQuery] = useState("");

  const active = useMemo(
    () => topic(activeId) ?? index.topics[0],
    [topic, activeId, index.topics],
  );

  const searchHits = useMemo(() => (query.length >= 2 ? search(query) : []), [query, search]);

  const selectTopic = useCallback(
    (t: ClinicalTopic) => {
      setActiveId(t.id);
      router.replace(`/reference?topic=${t.id}`, { scroll: false });
    },
    [router],
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-[var(--clinical-border)] bg-[var(--clinical-sidebar)] lg:w-72 lg:border-b-0 lg:border-r">
        <div className="border-b border-[var(--clinical-border)] p-3">
          <h1 className="text-sm font-bold">{index.title}</h1>
          <p className="text-[10px] text-[var(--clinical-foreground-muted)]">
            Методики измерений · v{index.version}
          </p>
          <p className="mt-1 text-[10px]">
            <Link href="/nosologies" className="font-medium text-[var(--clinical-primary)] underline">
              Справочник нозологий →
            </Link>
            {" · "}
            <Link href="/reference/norms" className="font-medium text-[var(--clinical-primary)] underline">
              Нормы по сроку (Медведев) →
            </Link>
          </p>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-[var(--clinical-foreground-muted)]" />
            <Input
              className="pl-8"
              placeholder="Поиск…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto max-h-[40vh] lg:max-h-none">
          {query.length >= 2 && searchHits.length > 0 ? (
            <ul className="p-2">
              {searchHits.map((hit: { topicId: string; title: string; snippet: string }) => (
                <li key={hit.topicId}>
                  <button
                    type="button"
                    className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--clinical-muted)]"
                    onClick={() => {
                      const t = topic(hit.topicId);
                      if (t) selectTopic(t);
                    }}
                  >
                    <span className="font-medium">{hit.title}</span>
                    <p
                      className="mt-0.5 text-xs text-[var(--clinical-foreground-muted)]"
                      dangerouslySetInnerHTML={{ __html: highlightText(hit.snippet, query) }}
                    />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <nav className="p-2">
              {[...sections.entries()].map(([section, topics]) => (
                <div key={section} className="mb-3">
                  <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
                    {section}
                  </p>
                  {topics.map((t: ClinicalTopic) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => selectTopic(t)}
                      className={cn(
                        "w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        active?.id === t.id
                          ? "bg-[var(--clinical-primary-muted)] font-semibold text-[var(--clinical-primary-deep)]"
                          : "hover:bg-[var(--clinical-muted)]",
                      )}
                    >
                      {t.title}
                    </button>
                  ))}
                </div>
              ))}
            </nav>
          )}
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-auto p-6">
        {active ? (
          <article className="mx-auto max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
              {active.section}
            </p>
            <h2 className="mt-1 text-2xl font-bold">{active.title}</h2>
            <p
              className="mt-4 text-base leading-relaxed text-[var(--clinical-foreground)]"
              dangerouslySetInnerHTML={{ __html: highlightText(active.summary, query) }}
            />
            <section className="mt-6 rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] p-5">
              <h3 className="text-sm font-bold">Методика</h3>
              <p
                className="mt-2 text-sm leading-relaxed text-[var(--clinical-foreground-muted)]"
                dangerouslySetInnerHTML={{ __html: highlightText(active.methodology, query) }}
              />
            </section>
            <section className="mt-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--clinical-foreground-muted)]">
                Источники
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--clinical-foreground-muted)]">
                {active.sources.map((s: string) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </section>
            <p className="mt-8 text-xs text-[var(--clinical-foreground-muted)]">
              Справочник встроен в приложение. Не заменяет локальные протоколы клиники и действующие
              клинические рекомендации.
            </p>
          </article>
        ) : null}
      </main>
    </div>
  );
}
