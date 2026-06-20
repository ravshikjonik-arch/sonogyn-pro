import {
  Activity,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  GitCompare,
  Lightbulb,
  ScanSearch,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

const SECTION_ICONS: Array<{ match: RegExp; icon: LucideIcon }> = [
  { match: /заключение/i, icon: CheckCircle2 },
  { match: /находк|признак|результат/i, icon: ScanSearch },
  { match: /анатом|ориентир/i, icon: Activity },
  { match: /ключев|особенност|момент/i, icon: Lightbulb },
  { match: /классиф|тип/i, icon: ClipboardList },
  { match: /диагност|обследован|оценк|веден/i, icon: Stethoscope },
  { match: /дифференц/i, icon: GitCompare },
  { match: /клиническ|прогноз|значен/i, icon: AlertTriangle },
  { match: /систем|подход|раздел|глава|мысль/i, icon: BookOpen },
];

export function getSectionIcon(title: string): LucideIcon {
  return SECTION_ICONS.find(({ match }) => match.test(title))?.icon ?? BookOpen;
}

export function isConclusionSection(title: string): boolean {
  return /заключение/i.test(title);
}
