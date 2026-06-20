"use client";

import type { LucideIcon } from "lucide-react";
import {
  Baby,
  Calendar,
  CalendarArrowDown,
  Circle,
  Egg,
  Hospital,
  Pill,
  Scale,
  Scan,
  ScanLine,
  Stethoscope,
} from "lucide-react";

import type { AppointmentCalcIcon } from "@repo/clinical-tools";

const ICON_MAP: Record<AppointmentCalcIcon, LucideIcon> = {
  calendar: Calendar,
  ultrasound: ScanLine,
  egg: Egg,
  baby: Baby,
  hospital: Hospital,
  stroller: Calendar,
  "calendar-back": CalendarArrowDown,
  "fetus-scan": Scan,
  scale: Scale,
  circle: Circle,
  scar: Stethoscope,
  breast: Baby,
  cervix: Circle,
  colposcopy: Scan,
  ovary: Egg,
  pill: Pill,
};

export function AppointmentCalcIconView({
  icon,
  className,
}: {
  icon: AppointmentCalcIcon;
  className?: string;
}) {
  const Icon = ICON_MAP[icon] ?? Circle;
  return <Icon className={className} aria-hidden />;
}
