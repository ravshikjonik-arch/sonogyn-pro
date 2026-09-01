import {
  ArrowRight,
  Brain,
  ClipboardList,
  FileText,
  Library,
  MessageCircle,
  ScanLine,
  Search,
  ShieldCheck,
  Upload,
} from "lucide-react";
import Link from "next/link";

import {
  ClinicalResult,
  ClinicalSheet,
  ClinicalWorkspace,
  ContinuationDock,
  FloatingInsight,
  KnowledgeConstellation,
  SonoOrb,
  SpatialCard,
} from "@/components/spatial";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const primaryActions = [
  {
    title: "O-RADS US",
    description: "Wizard, текстовый разбор, IOTA и таблицы ACR в одном сценарии.",
    href: "/tools/calc/rads/o-rads",
    icon: ScanLine,
  },
  {
    title: "AI-зона снимков",
    description: "Загрузить УЗИ, собрать контекст и перейти к разбору.",
    href: "/ai/workspace",
    icon: Upload,
  },
  {
    title: "Кейсы коллег",
    description: "Похожие случаи, обсуждения и обучающие подборки.",
    href: "/cases?tab=cases&playlist=orads-adnexal",
    icon: MessageCircle,
  },
  {
    title: "КР и справочник",
    description: "Открыть клинические рекомендации и рабочие протоколы.",
    href: "/tools/refs/guidelines",
    icon: Library,
  },
];

const routeSteps = [
  { label: "Ввод", detail: "Размер, морфология, кровоток", icon: ClipboardList },
  { label: "AI", detail: "Извлечение признаков из текста", icon: Brain },
  { label: "Кейсы", detail: "Плейлист adnexal masses", icon: Search },
  { label: "Черновик", detail: "Текст протокола без диагноза", icon: FileText },
];

export function CommandCenter() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-10 lg:py-8" data-testid="app-home">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <SpatialCard depth={3} className="overflow-hidden p-5 sm:p-7">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-3xl space-y-4">
                <div className="flex items-center gap-3">
                  <SonoOrb label="SG" size="lg" />
                  <div>
                    <Badge variant="outline" className="border-[var(--clinical-border)]">
                      Command Center
                    </Badge>
                    <h1 className="mt-2 text-2xl font-black tracking-tight text-[var(--clinical-foreground)] sm:text-4xl">
                      SonoGyn Pro
                    </h1>
                  </div>
                </div>
                <p className="max-w-2xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)] sm:text-base">
                  Главная рабочая зона врача: от клинической задачи к калькулятору, AI-подсказке,
                  похожим кейсам и черновику протокола.
                </p>
              </div>
              <Button asChild className="w-full gap-2 sm:w-auto">
                <Link href="/tools/calc/rads/o-rads">
                  Начать O-RADS
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </SpatialCard>

          <ClinicalResult label="Пилотный маршрут" value="O-RADS + AI" confidence="Категория считается только локальным O-RADS engine">
            AI помогает извлечь признаки и сформировать черновик текста, но не подменяет клиническое решение врача.
          </ClinicalResult>
        </header>

        <ClinicalWorkspace
          side={
            <>
              <FloatingInsight title="Безопасность" tone="safety">
                Не вставляйте ФИО, телефон, адрес, номер карты и другие идентификаторы пациентки в AI-поле.
              </FloatingInsight>
              <FloatingInsight title="Что продолжить" tone="ai">
                Самый ценный следующий шаг — пройти O-RADS и сравнить вывод с обучающими кейсами.
              </FloatingInsight>
            </>
          }
        >
          <div className="space-y-5">
            <ClinicalSheet title="Быстрые действия" eyebrow="Рабочий стол">
              <div className="grid gap-3 sm:grid-cols-2">
                {primaryActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.href} href={action.href} className="block">
                      <SpatialCard
                        depth={1}
                        interactive
                        className="h-full p-4"
                        aria-label={action.title}
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--sg-radius-sm)] bg-[var(--clinical-primary-muted)] text-[var(--clinical-primary-deep)]">
                            <Icon className="h-5 w-5" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-[var(--clinical-foreground)]">{action.title}</p>
                            <p className="mt-1 text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
                              {action.description}
                            </p>
                          </div>
                        </div>
                      </SpatialCard>
                    </Link>
                  );
                })}
              </div>
            </ClinicalSheet>

            <ClinicalSheet title="O-RADS pilot flow" eyebrow="Main → AI → Cases → Draft">
              <KnowledgeConstellation
                nodes={routeSteps.map((step) => {
                  const Icon = step.icon;
                  return {
                    title: step.label,
                    description: step.detail,
                    icon: <Icon className="h-4 w-4" />,
                  };
                })}
              />
            </ClinicalSheet>
          </div>
        </ClinicalWorkspace>

        <ContinuationDock>
          <Button asChild size="sm" className="gap-2">
            <Link href="/tools/calc/rads/o-rads">
              O-RADS wizard
              <ScanLine className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-2">
            <Link href="/cases?tab=cases&playlist=orads-adnexal">
              Похожие кейсы
              <MessageCircle className="h-4 w-4" />
            </Link>
          </Button>
          <span className="ml-auto hidden items-center gap-1.5 text-xs font-semibold text-[var(--clinical-foreground-muted)] sm:flex">
            <ShieldCheck className="h-4 w-4" />
            PHI-aware workspace
          </span>
        </ContinuationDock>
      </div>
    </div>
  );
}
