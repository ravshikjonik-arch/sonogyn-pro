"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookOpenCheck,
  ClipboardList,
  Library,
  Search,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * B3 — calm “стол приёма”: one strip that glues patients / checklist / evidence / library
 * onto the existing appointment calculator hub. No new patient data, no PHI.
 */
export function ReceptionDeskStrip() {
  const router = useRouter();
  const [evidenceQ, setEvidenceQ] = useState("");

  function goEvidence(e: React.FormEvent) {
    e.preventDefault();
    const q = evidenceQ.trim();
    const href = q
      ? `/tools/refs/evidence-assistant?q=${encodeURIComponent(q)}`
      : "/tools/refs/evidence-assistant";
    router.push(href);
  }

  return (
    <section
      className="space-y-3 rounded-2xl border border-[var(--clinical-border)] bg-[var(--clinical-surface)] p-4"
      aria-label="Стол приёма"
    >
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--clinical-primary-deep)]">
          Стол приёма
        </p>
        <p className="mt-1 text-sm text-[var(--clinical-foreground-muted)]">
          Пациент → чек-лист → калькулятор → цитаты из КР — без прыжков по вкладкам браузера.
        </p>
      </header>

      <div className="grid gap-2 sm:grid-cols-2">
        <DeskLink
          href="/profile/patients"
          icon={<Users className="h-4 w-4" aria-hidden />}
          title="Пациенты"
          subtitle="Карточки и история (без PHI в чате)"
        />
        <DeskLink
          href="/tools/refs/ambulatory-intake"
          icon={<ClipboardList className="h-4 w-4" aria-hidden />}
          title="Чек-лист амбулатории"
          subtitle="Сценарий приёма АГ"
        />
        <DeskLink
          href="/tools/refs/evidence-assistant"
          icon={<BookOpenCheck className="h-4 w-4" aria-hidden />}
          title="Evidence Assistant"
          subtitle="КР / PubMed / vault"
        />
        <DeskLink
          href="/tools/refs/medical-knowledge"
          icon={<Library className="h-4 w-4" aria-hidden />}
          title="Библиотека знаний"
          subtitle="Опубликованные источники"
        />
      </div>

      <form onSubmit={goEvidence} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--clinical-foreground-muted)]" />
          <Input
            value={evidenceQ}
            onChange={(e) => setEvidenceQ(e.target.value)}
            placeholder="Спросить КР: узловой зоб, EU-TIRADS 5…"
            className="rounded-xl pl-10"
            aria-label="Быстрый запрос в Evidence"
          />
        </div>
        <Button type="submit" className="rounded-xl shrink-0">
          Найти в Evidence
        </Button>
      </form>
    </section>
  );
}

function DeskLink({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-xl border border-[var(--clinical-border)] bg-[var(--clinical-card)] px-3 py-2.5 transition hover:border-[var(--clinical-primary)]"
    >
      <span className="mt-0.5 text-[var(--clinical-primary)]">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[var(--clinical-foreground)]">{title}</span>
        <span className="block text-[11px] text-[var(--clinical-foreground-muted)]">{subtitle}</span>
      </span>
    </Link>
  );
}
