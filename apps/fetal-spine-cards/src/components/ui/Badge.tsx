import { cn } from "@/lib/cn";

type BadgeProps = {
  children: React.ReactNode;
  variant?: "default" | "navy" | "teal" | "accent" | "ghost";
  className?: string;
};

const variants = {
  default: "bg-slate-100 text-slate-700 border border-slate-200/80",
  navy: "bg-medical-navy text-white border border-medical-navy-light",
  teal: "bg-medical-teal-soft text-medical-navy border border-medical-teal/30",
  accent: "bg-medical-accent-soft text-amber-900 border border-amber-200/80",
  ghost: "bg-white/15 text-white border border-white/20",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
