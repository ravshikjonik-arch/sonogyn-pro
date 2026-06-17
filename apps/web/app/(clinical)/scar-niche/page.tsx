import Link from "next/link";

import { ScarNicheWorkspace } from "@/components/scar/ScarNicheWorkspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ScarNichePage() {
  return (
    <div className="px-4 py-10 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="sonogyn-glass-card sonogyn-hero-orbs relative overflow-hidden rounded-3xl p-8 sm:p-10">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-600/10 via-transparent to-rose-500/10" />
          <div className="relative space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-slate-700">Рубец после КС</Badge>
              <Badge variant="outline">ниша / истмоцеле</Badge>
              <Badge variant="outline">беременность в рубце</Badge>
            </div>
            <div className="space-y-3">
              <h1 className="sonogyn-gradient-text text-3xl font-black tracking-tight sm:text-4xl">
                Рубец на матке / ниша / беременность в рубце
              </h1>
              <p className="max-w-3xl text-sm leading-relaxed text-[var(--clinical-foreground-muted)] sm:text-base">
                Сагиттальный и фронтальный/коронарный срезы для разметки зоны рубца. В гинекологии — ниша/истмоцеле;
                в ранней беременности — отношение плодного яйца к рубцу после кесарева сечения.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="#workspace">Открыть workspace</Link>
              </Button>
              <Button variant="secondary" asChild>
                <Link href="/assistant/fmf?section=scar">FMF · рубец</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/uterus-3d">Матка 3D</Link>
              </Button>
            </div>
          </div>
        </header>

        <section id="workspace" className="scroll-mt-24">
          <ScarNicheWorkspace />
        </section>

        <p className="text-center text-xs leading-relaxed text-[var(--clinical-foreground-muted)]">
          Учебный/справочный материал; не является диагнозом. Подозрение на беременность в рубце требует
          целенаправленного ТВУЗИ/ЦДК и клинической маршрутизации.
        </p>
      </div>
    </div>
  );
}
