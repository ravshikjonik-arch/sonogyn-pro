import Link from "next/link";

import { FigoMyomaWorkspace } from "@/components/uterus/FigoMyomaWorkspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function FigoMyomaPage() {
  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="sonogyn-glass-card sonogyn-hero-orbs relative overflow-hidden rounded-3xl p-8 sm:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-rose-500/10" />
          <div className="relative space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-violet-700">FIGO</Badge>
              <Badge variant="outline">Миома матки</Badge>
              <Badge variant="outline">2D workspace</Badge>
            </div>
            <div className="space-y-3">
              <h1 className="sonogyn-gradient-text text-3xl font-black tracking-tight sm:text-4xl">
                FIGO workspace — миоматозные узлы
              </h1>
              <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)] sm:text-base">
                Рабочий экран для врача УЗИ: поставить узел на сагиттальном срезе, уточнить размеры L×W×D,
                подтвердить FIGO 0–8 и получить готовую строку для протокола.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="#workspace">Открыть рабочую схему</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/uterus-3d">Коронарный макет</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/calculators/figo">FIGO калькулятор</Link>
              </Button>
            </div>
          </div>
        </header>

        <section id="workspace" className="scroll-mt-24">
          <FigoMyomaWorkspace />
        </section>

        <p className="text-center text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
          Учебный/справочный материал; не является диагнозом. FIGO-подсказка помогает структурировать описание,
          финальную интерпретацию выполняет специалист с учётом УЗ-картины и клинического контекста.
        </p>
      </div>
    </div>
  );
}
