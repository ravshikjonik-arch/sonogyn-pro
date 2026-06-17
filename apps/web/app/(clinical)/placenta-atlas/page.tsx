import Link from "next/link";

import { PlacentaVasaWorkspace } from "@/components/placenta/PlacentaVasaWorkspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PlacentaAtlasPage() {
  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="sonogyn-glass-card sonogyn-hero-orbs relative overflow-hidden rounded-3xl p-8 sm:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-600/10 via-transparent to-blue-500/10" />
          <div className="relative space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-rose-700">Беременность</Badge>
              <Badge variant="outline">Плацента</Badge>
              <Badge variant="outline">vasa previa</Badge>
            </div>
            <div className="space-y-3">
              <h1 className="sonogyn-gradient-text text-3xl font-black tracking-tight sm:text-4xl">
                Плацента / предлежание / vasa previa
              </h1>
              <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)] sm:text-base">
                2D workspace для акушерского протокола: нижний край плаценты, внутренний зев, сосуды, прикрепление
                пуповины и подсказка по vasa previa. Используйте вместе с ЦДК/ТВУЗИ и клиническим контекстом.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="#workspace">Открыть схему</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/assistant/fmf?section=second">FMF II–III скрининг</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/calculators/cervical-length">Шейка / CL</Link>
              </Button>
            </div>
          </div>
        </header>

        <section id="workspace" className="scroll-mt-24">
          <PlacentaVasaWorkspace />
        </section>

        <p className="text-center text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
          Учебный/справочный материал; не является диагнозом. Подозрение на vasa previa требует целенаправленной
          оценки сосудов с ЦДК/ТВУЗИ и маршрутизации по локальному протоколу.
        </p>
      </div>
    </div>
  );
}
