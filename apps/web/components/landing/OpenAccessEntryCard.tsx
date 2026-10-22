import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  OPEN_ACCESS_DEMO_DETAIL_RU,
  OPEN_ACCESS_DEMO_FOOTNOTE_RU,
} from "@/lib/config/platform";
import { cn } from "@/lib/utils/cn";

type Props = {
  className?: string;
};

/** Open access: вместо формы регистрации — сразу в кабинет. */
export function OpenAccessEntryCard({ className }: Props) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-white/15 bg-black/45 p-5 text-white shadow-xl backdrop-blur-md",
        className,
      )}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200/80">Без регистрации</p>
      <h3 className="mt-2 text-xl font-black tracking-tight">Сразу в кабинет</h3>
      <p className="mt-2 text-sm leading-relaxed text-violet-100/80">{OPEN_ACCESS_DEMO_DETAIL_RU}</p>
      <div className="mt-5 flex flex-col gap-2">
        <Button asChild size="lg" className="w-full bg-white font-semibold text-violet-900 hover:bg-white/95">
          <Link href="/home">
            Открыть кабинет
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-violet-100/55">{OPEN_ACCESS_DEMO_FOOTNOTE_RU}</p>
    </div>
  );
}
