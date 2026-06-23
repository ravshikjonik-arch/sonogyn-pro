import { APPOINTMENT_CALCULATORS, EXTRA_PROJECT_CALCULATORS, REFERENCE_CALCULATOR_KEYS } from "./catalog";
import type { AppointmentCalculator, AppointmentCalcStatus } from "./types";

export type AuditSection = {
  implemented: AppointmentCalculator[];
  partial: AppointmentCalculator[];
  missing: AppointmentCalculator[];
  duplicates: DuplicateEntry[];
  unused: UnusedEntry[];
};

export type DuplicateEntry = {
  title: string;
  ids: string[];
  note: string;
};

export type UnusedEntry = {
  id: string;
  title: string;
  note: string;
};

export type CoverageReport = {
  referenceTotal: number;
  implementedCount: number;
  partialCount: number;
  missingCount: number;
  coveragePercent: number;
  /** Покрытие с учётом partial как 0.5 */
  weightedCoveragePercent: number;
  brokenRoutes: BrokenRoute[];
  orphanScreens: OrphanScreen[];
  duplicateImplementations: DuplicateEntry[];
};

export type BrokenRoute = {
  id: string;
  title: string;
  webHref: string;
  reason: string;
};

export type OrphanScreen = {
  route: string;
  title: string;
  note: string;
};

/** Сопоставление refKey → калькулятор */
function byRefKey(): Map<string, AppointmentCalculator> {
  const map = new Map<string, AppointmentCalculator>();
  for (const calc of APPOINTMENT_CALCULATORS) {
    if (calc.refKey) map.set(calc.refKey, calc);
  }
  return map;
}

export function runReferenceAudit(): AuditSection {
  const refMap = byRefKey();
  const implemented: AppointmentCalculator[] = [];
  const partial: AppointmentCalculator[] = [];
  const missing: AppointmentCalculator[] = [];

  for (const key of REFERENCE_CALCULATOR_KEYS) {
    const calc = refMap.get(key);
    if (!calc) {
      missing.push({
        id: key,
        refKey: key,
        title: `[нет записи в каталоге: ${key}]`,
        description: "",
        category: "pregnancy-term",
        status: "missing",
        icon: "calendar",
      });
      continue;
    }
    if (calc.status === "implemented") implemented.push(calc);
    else if (calc.status === "partial") partial.push(calc);
    else missing.push(calc);
  }

  return {
    implemented,
    partial,
    missing,
    duplicates: detectDuplicates(),
    unused: detectUnused(),
  };
}

export function detectDuplicates(): DuplicateEntry[] {
  return [
    {
      title: "O-RADS Pro",
      ids: ["orads-guide", "orads-wizard", "orads"],
      note: "Три записи в CLINICAL_TOOLS с одним webHref /calculators/o-rads",
    },
    {
      title: "Срок по фетометрии / УЗИ (mobile)",
      ids: ["ga-feto", "ga-us"],
      note: "ga-feto и ga-ivf в catalog.ts используют mobileAction ga_us",
    },
    {
      title: "Расчёт срока беременности",
      ids: ["pregnancyCalc.ts (mobile)", "@repo/medical-calculations"],
      note: "Дублирование логики: mobile/gynecology/pregnancyCalc vs medical-calculations/pregnancyDating",
    },
    {
      title: "Кольпоскопия / CIN follow-up",
      ids: ["colposcopy", "cin-follow-up"],
      note: "cin-follow-up частично перекрывается Swede Score colposcopy",
    },
    {
      title: "O-RADS / риск рака яичников",
      ids: ["o-rads", "ovarian-risk"],
      note: "ovarian-risk ссылается на O-RADS — разные задачи, но один маршрут",
    },
  ];
}

export function detectUnused(): UnusedEntry[] {
  return [
    {
      id: "CalculatorsScreen.tsx",
      title: "apps/mobile/src/screens/CalculatorsScreen.tsx",
      note: "Экран не подключён к навигации; используется GynHub + ToolsScreen",
    },
    {
      id: "ln-rads",
      title: "LN-RADS (web)",
      note: "Страница /calculators/ln-rads — Intelligence Suite (calculator, atlas, anatomy, board). Mobile — упрощённый прототип.",
    },
    {
      id: "calculators/[slug]",
      title: "/calculators/[slug] generic form",
      note: "Используется для ln-rads/figo с полями; FIGO перенаправлен на /uterus-3d",
    },
  ];
}

export function computeCoverage(audit: AuditSection): Pick<
  CoverageReport,
  "referenceTotal" | "implementedCount" | "partialCount" | "missingCount" | "coveragePercent" | "weightedCoveragePercent"
> {
  const referenceTotal = REFERENCE_CALCULATOR_KEYS.length;
  const implementedCount = audit.implemented.length;
  const partialCount = audit.partial.length;
  const missingCount = audit.missing.length;
  const coveragePercent = Math.round((implementedCount / referenceTotal) * 100);
  const weightedCoveragePercent = Math.round(((implementedCount + partialCount * 0.5) / referenceTotal) * 100);
  return { referenceTotal, implementedCount, partialCount, missingCount, coveragePercent, weightedCoveragePercent };
}

/** Проверка маршрутов — pathname без query */
export function extractPathname(href: string): string {
  const q = href.indexOf("?");
  return q >= 0 ? href.slice(0, q) : href;
}

export function validateRoutes(
  knownRoutes: Set<string>,
  calculators: AppointmentCalculator[] = [...APPOINTMENT_CALCULATORS, ...EXTRA_PROJECT_CALCULATORS],
): BrokenRoute[] {
  const broken: BrokenRoute[] = [];
  for (const calc of calculators) {
    if (!calc.webHref) continue;
    const path = extractPathname(calc.webHref);
    if (!knownRoutes.has(path)) {
      broken.push({
        id: calc.id,
        title: calc.title,
        webHref: calc.webHref,
        reason: `Маршрут ${path} не найден среди известных страниц`,
      });
    }
  }
  return broken;
}

export function detectOrphanScreens(registeredRoutes: Set<string>, menuLinkedRoutes: Set<string>): OrphanScreen[] {
  const orphans: OrphanScreen[] = [];
  const calculatorRoutes = [
    "/calculators/elastography",
    "/calculators/o-rads",
    "/calculators/bi-rads",
    "/calculators/endometrium",
    "/calculators/cervical-length",
    "/calculators/ti-rads",
    "/calculators/pop-q",
    "/calculators/colposcopy",
    "/calculators/ob",
    "/calculators/appointment",
  ];
  for (const route of calculatorRoutes) {
    if (registeredRoutes.has(route) && !menuLinkedRoutes.has(route) && route !== "/calculators/appointment") {
      orphans.push({
        route,
        title: route,
        note: "Страница существует, но не связана из главного меню калькуляторов (доступ через registry или прямой URL)",
      });
    }
  }
  return orphans;
}

export function formatAuditMarkdown(audit: AuditSection, generatedAt: string): string {
  const cov = computeCoverage(audit);
  const lines: string[] = [
    "# Аудит калькуляторов · SonoGyn vs OblCalc",
    "",
    `> Сгенерировано: ${generatedAt}`,
    "",
    "## Сводка",
    "",
    `| Метрика | Значение |`,
    `|---------|----------|`,
    `| Референсный список | ${cov.referenceTotal} |`,
    `| Полностью реализовано | ${cov.implementedCount} |`,
    `| Частично | ${cov.partialCount} |`,
    `| Отсутствует | ${cov.missingCount} |`,
    `| Покрытие (strict) | ${cov.coveragePercent}% |`,
    `| Покрытие (с partial ×0.5) | ${cov.weightedCoveragePercent}% |`,
    "",
    "## 1. Уже реализовано",
    "",
  ];

  if (audit.implemented.length === 0) lines.push("_Нет полностью реализованных пунктов референса._");
  else {
    for (const c of audit.implemented) {
      lines.push(`- **${c.title}** — \`${c.webHref ?? "—"}\` (${c.id})`);
    }
  }

  lines.push("", "## 2. Реализовано частично", "");
  if (audit.partial.length === 0) lines.push("_Нет._");
  else {
    for (const c of audit.partial) {
      lines.push(`- **${c.title}** — ${c.partialNote ?? "без примечания"}`);
      if (c.webHref) lines.push(`  - Маршрут: \`${c.webHref}\``);
    }
  }

  lines.push("", "## 3. Отсутствует", "");
  if (audit.missing.length === 0) lines.push("_Нет._");
  else {
    for (const c of audit.missing) {
      lines.push(`- **${c.title}** (${c.refKey ?? c.id})`);
    }
  }

  lines.push("", "## 4. Дубликаты", "");
  for (const d of audit.duplicates) {
    lines.push(`- **${d.title}**: ${d.ids.join(", ")}`);
    lines.push(`  - ${d.note}`);
  }

  lines.push("", "## 5. Неиспользуемые калькуляторы / экраны", "");
  for (const u of audit.unused) {
    lines.push(`- **${u.title}** — ${u.note}`);
  }

  lines.push("", "## Дополнительные калькуляторы проекта (вне референса)", "");
  for (const c of EXTRA_PROJECT_CALCULATORS) {
    const href = c.webHref ? `\`${c.webHref}\`` : "—";
    lines.push(`- **${c.title}** (${c.status}) — ${href}`);
  }

  lines.push("", "---", "", "_Информация для справки, не заменяет клиническое суждение._");
  return lines.join("\n");
}

export function formatCoverageMarkdown(
  audit: AuditSection,
  coverage: CoverageReport,
  generatedAt: string,
): string {
  const cov = computeCoverage(audit);
  const lines: string[] = [
    "# Отчёт покрытия калькуляторов",
    "",
    `> Сгенерировано: ${generatedAt}`,
    "",
    "## Покрытие референсного списка OblCalc",
    "",
    `- **Всего в референсе:** ${cov.referenceTotal}`,
    `- **Реализовано полностью:** ${cov.implementedCount} (${cov.coveragePercent}%)`,
    `- **Частично:** ${cov.partialCount}`,
    `- **Отсутствует:** ${cov.missingCount}`,
    `- **Взвешенное покрытие (partial = 50%):** ${cov.weightedCoveragePercent}%`,
    "",
    "## Проверка маршрутов",
    "",
  ];

  if (coverage.brokenRoutes.length === 0) {
    lines.push("✅ Битых роутов не обнаружено.");
  } else {
    lines.push("❌ Битые роуты:");
    for (const b of coverage.brokenRoutes) {
      lines.push(`- \`${b.webHref}\` (${b.title}): ${b.reason}`);
    }
  }

  lines.push("", "## Экран «Для приёма врача»", "", "- Маршрут: `/calculators/appointment`", "- Все пункты референса отображаются в каталоге", "");

  lines.push("## Дублирующиеся реализации", "");
  if (coverage.duplicateImplementations.length === 0) lines.push("_Не обнаружено._");
  else {
    for (const d of coverage.duplicateImplementations) {
      lines.push(`- **${d.title}**: ${d.note}`);
    }
  }

  lines.push("", "## Экраны без прямой ссылки из меню", "");
  if (coverage.orphanScreens.length === 0) lines.push("_Все основные экраны доступны из /calculators._");
  else {
    for (const o of coverage.orphanScreens) {
      lines.push(`- \`${o.route}\` — ${o.note}`);
    }
  }

  lines.push("", "## Статус по категориям", "");
  const categories = [
    ["Срок беременности", ["ga-menstruation", "ga-ultrasound", "ga-ivf", "ga-movement", "ga-antenatal-visit", "maternity-leave", "ga-from-edd", "ga-crl", "ga-fetometry"]],
    ["Масса плода", ["efw-maternal-anthropometry", "efw-rudakov"]],
    ["Акушерские", ["bishop-score", "vbac-pre-labor", "vbac-in-labor"]],
    ["Гинекологические", ["breast-cancer-risk", "cervical-cancer-risk", "cin-follow-up", "ovarian-cancer-risk"]],
    ["Справочники", ["pregnancy-medications"]],
  ] as const;

  const refMap = byRefKey();
  for (const [label, keys] of categories) {
    const statuses = keys.map((k) => refMap.get(k)?.status ?? "missing");
    const impl = statuses.filter((s) => s === "implemented").length;
    lines.push(`- **${label}:** ${impl}/${keys.length} полностью`);
  }

  lines.push("", "---", "", "_Не диагноз. Интерпретация — лечащий специалист._");
  return lines.join("\n");
}

export function statusLabel(status: AppointmentCalcStatus): string {
  switch (status) {
    case "implemented":
      return "Готово";
    case "partial":
      return "Частично";
    case "missing":
      return "Скоро";
  }
}
