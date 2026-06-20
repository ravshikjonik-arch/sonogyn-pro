import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

import type { UltrasoundCard } from "@/data/cardsData";

type CardNavigationProps = {
  prev?: UltrasoundCard;
  next?: UltrasoundCard;
};

export function CardNavigation({ prev, next }: CardNavigationProps) {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2">
      {prev ? (
        <Link
          to={`/card/${prev.id}`}
          className="group flex items-center gap-3 rounded-2xl border border-medical-border bg-white p-4 shadow-sm transition-all hover:border-medical-teal/50 hover:shadow-md"
        >
          <ChevronLeft className="h-5 w-5 shrink-0 text-medical-teal" />
          <div className="min-w-0 text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-medical-muted">Предыдущая</p>
            <p className="truncate text-sm font-semibold text-medical-navy group-hover:text-medical-teal-dark">
              {prev.title}
            </p>
          </div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link
          to={`/card/${next.id}`}
          className="group flex items-center justify-end gap-3 rounded-2xl border border-medical-border bg-white p-4 shadow-sm transition-all hover:border-medical-teal/50 hover:shadow-md sm:col-start-2"
        >
          <div className="min-w-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-medical-muted">Следующая</p>
            <p className="truncate text-sm font-semibold text-medical-navy group-hover:text-medical-teal-dark">
              {next.title}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-medical-teal" />
        </Link>
      ) : null}
    </div>
  );
}
