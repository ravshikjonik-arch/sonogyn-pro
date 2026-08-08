import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
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
      <p className="mt-2 text-sm leading-relaxed text-violet-100/80">
        Калькуляторы, FMF и справочники открыты. Войдите только чтобы сохранить кейсы и пациентов.
      </p>
      <div className="mt-5 flex flex-col gap-2">
        <Button asChild size="lg" className="w-full bg-white font-semibold text-violet-900 hover:bg-white/95">
          <Link href="/app">
            Открыть кабинет
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="w-full border-white/30 bg-transparent text-white hover:bg-white/10">
          <Link href="/login?redirectedFrom=/app">Войти (сохранение кейсов)</Link>
        </Button>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-violet-100/55">
        Скоро: вход через Яндекс ID и SMS. Регистрация по email не обязательна.
      </p>
    </div>
  );
}
