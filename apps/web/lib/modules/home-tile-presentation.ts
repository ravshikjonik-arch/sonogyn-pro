import type { ModuleId } from "@repo/clinical-tools";
import type { LucideIcon } from "lucide-react";
import {
  Baby,
  Brain,
  Calculator,
  CircleDot,
  FileText,
  GraduationCap,
  HandHeart,
  Layers,
  MessageCircle,
  ScanLine,
  Stethoscope,
} from "lucide-react";

export type HomeTilePresentation = {
  icon: LucideIcon;
  badge: string;
  accentBar: string;
};

const HOME_TILE_MODULE_IDS = [
  "community.chat",
  "assistant.hub",
  "calculator.ob-hub",
  "calculator.hub",
  "reference.guidelines",
  "education.library-hub",
  "education.isuog-basic",
  "mockup.hub",
  "mockup.ovary",
  "mockup.uterus",
  "mockup.breast",
  "workspace.ai",
] as const satisfies readonly ModuleId[];

/** Visual layer for /app tiles — icons, badges, gradients (not in modules.catalog SSOT). */
export const HOME_TILE_PRESENTATION: Record<(typeof HOME_TILE_MODULE_IDS)[number], HomeTilePresentation> =
  {
    "community.chat": {
      icon: MessageCircle,
      badge: "Live",
      accentBar: "bg-gradient-to-r from-emerald-500 to-teal-500",
    },
    "assistant.hub": {
      icon: HandHeart,
      badge: "Маршрут",
      accentBar: "bg-gradient-to-r from-rose-600 to-pink-500",
    },
    "calculator.ob-hub": {
      icon: Baby,
      badge: "Срок",
      accentBar: "bg-gradient-to-r from-teal-600 to-cyan-500",
    },
    "calculator.hub": {
      icon: Calculator,
      badge: "CDS",
      accentBar: "bg-gradient-to-r from-blue-500 to-cyan-400",
    },
    "reference.guidelines": {
      icon: FileText,
      badge: "КР",
      accentBar: "bg-gradient-to-r from-amber-500 to-orange-400",
    },
    "education.library-hub": {
      icon: Layers,
      badge: "Edu",
      accentBar: "bg-gradient-to-r from-violet-500 to-purple-400",
    },
    "education.isuog-basic": {
      icon: GraduationCap,
      badge: "ISUOG",
      accentBar: "bg-gradient-to-r from-rose-600 to-orange-500",
    },
    "mockup.hub": {
      icon: Layers,
      badge: "3 макета",
      accentBar: "bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500",
    },
    "mockup.ovary": {
      icon: CircleDot,
      badge: "ИИ",
      accentBar: "bg-gradient-to-r from-violet-600 to-purple-500",
    },
    "mockup.uterus": {
      icon: Stethoscope,
      badge: "FIGO",
      accentBar: "bg-gradient-to-r from-indigo-500 to-blue-400",
    },
    "mockup.breast": {
      icon: ScanLine,
      badge: "BI-RADS",
      accentBar: "bg-gradient-to-r from-pink-500 to-rose-400",
    },
    "workspace.ai": {
      icon: Brain,
      badge: "AI",
      accentBar: "bg-gradient-to-r from-sky-500 to-blue-500",
    },
  };

export function getHomeTilePresentation(id: ModuleId): HomeTilePresentation | undefined {
  return HOME_TILE_PRESENTATION[id as (typeof HOME_TILE_MODULE_IDS)[number]];
}
