import { avatarGradient, patientInitials } from "@/lib/patients/insights";
import { cn } from "@/lib/utils/cn";

export function PatientAvatar({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-sm",
        className,
      )}
      style={{ background: avatarGradient(label) }}
      aria-hidden
    >
      {patientInitials(label)}
    </span>
  );
}
