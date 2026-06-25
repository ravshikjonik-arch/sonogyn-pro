import fs from "fs";
import path from "path";

import {
  IOTA_BENIGN_DESCRIPTORS,
  IOTA_MALIGNANT_DESCRIPTORS,
  ORADS_US_MANAGEMENT,
  ORADS_US_PITFALL_BULLETS,
  ORADS_US_VERSION,
} from "@repo/adnex-education";

function loadBiradsRules(): {
  version?: string;
  options?: Record<string, { value: string; label: string }[]>;
  rules?: { category?: string; description?: string }[];
} {
  const candidates = [
    path.join(process.cwd(), "../../packages/birads-us/src/rules.birads.json"),
    path.join(process.cwd(), "packages/birads-us/src/rules.birads.json"),
  ];
  for (const file of candidates) {
    try {
      return JSON.parse(fs.readFileSync(file, "utf8")) as ReturnType<typeof loadBiradsRules>;
    } catch {
      /* try next */
    }
  }
  return {};
}

export type SonogynClinicalDomain = "breast" | "ovary" | "uterus" | "obstetric" | "general";

/** Определяем домен по тексту запроса — для подмешивания критериев (RAG-lite) */
export function inferClinicalDomain(text: string): SonogynClinicalDomain {
  const t = text.toLowerCase();
  if (/bi-?rads|молочн|мж\b|breast/.test(t)) return "breast";
  if (/o-?rads|iota|adnex|яичник|придаток|овари/.test(t)) return "ovary";
  if (/adenomyosis|аденомиоз|эндометри|миом|матк|омт|шейк/.test(t)) return "uterus";
  if (/fmf|скрининг|беремен|пдр|плод|ктр|твп/.test(t)) return "obstetric";
  return "general";
}

function biradsSnippet(): string {
  const rules = loadBiradsRules();
  const shapes = (rules.options?.shape ?? []).slice(0, 5).map((o) => o.label).join("; ");
  const margins = (rules.options?.margin ?? []).slice(0, 5).map((o) => o.label).join("; ");
  const cats = (rules.rules ?? [])
    .slice(0, 8)
    .map((c) => `${c.category ?? "?"}: ${c.description ?? ""}`)
    .join("\n");
  return [
    `BI-RADS US (${rules.version ?? "локальный ruleset"}):`,
    `Форма: ${shapes}`,
    `Контур: ${margins}`,
    "Категории:",
    cats,
  ].join("\n");
}

function oradsIotaSnippet(): string {
  const benign = IOTA_BENIGN_DESCRIPTORS.map((d) => d.code).join(", ");
  const malignant = IOTA_MALIGNANT_DESCRIPTORS.map((d) => d.code).join(", ");
  const mgmt = Object.entries(ORADS_US_MANAGEMENT)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  return [
    `${ORADS_US_VERSION} + IOTA Simple Rules`,
    `IOTA B: ${benign}`,
    `IOTA M: ${malignant}`,
    "O-RADS US тактика:",
    mgmt,
    "Pitfalls:",
    ...ORADS_US_PITFALL_BULLETS.slice(0, 4).map((b) => `- ${b}`),
  ].join("\n");
}

/** Контекст из справочников приложения — добавляйте ветки для новых модулей */
export function buildRagContext(domain: SonogynClinicalDomain, userText: string): string {
  const parts: string[] = [];
  if (domain === "breast" || domain === "general") {
    if (/bi-?rads|молочн|мж/.test(userText.toLowerCase()) || domain === "breast") {
      parts.push(biradsSnippet());
    }
  }
  if (domain === "ovary" || domain === "general") {
    if (/o-?rads|iota|adnex|яичник/.test(userText.toLowerCase()) || domain === "ovary") {
      parts.push(oradsIotaSnippet());
    }
  }
  if (domain === "uterus") {
    parts.push(
      "Матка/эндометрий: используй MUSA/FIGO там, где релевантно; для аденомиоза — диффузные/очаговые признаки, junctional zone, кисты, vascularity.",
    );
  }
  if (domain === "obstetric") {
    parts.push("FMF/ISUOG: скрининг I/II/III триместр, КТР, ТВП, допплер — по международным протоколам; не заменяй клиническое решение врача.");
  }
  return parts.join("\n\n---\n\n");
}
