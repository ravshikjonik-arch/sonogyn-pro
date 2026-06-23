import {
  APPOINTMENT_CALCULATORS,
  EXTRA_PROJECT_CALCULATORS,
  getAppointmentCalculatorById,
} from "./appointment-calculators/catalog";
import { MODULES, type ModuleEntry } from "./modules.catalog";

/** Registry slugs in apps/web/lib/calculators/registry.ts — mirrored for ref audit. */
export const REGISTRY_CALCULATOR_SLUGS = [
  "elastography",
  "o-rads",
  "bi-rads",
  "endometrium",
  "cervical-length",
  "figo",
  "ln-rads",
  "ti-rads",
  "pop-q",
  "colposcopy",
  "ob-calc",
  "fetal-weight",
  "bishop",
  "vbac",
  "pregnancy-medications",
  "fmf",
] as const;

export type ModulesCatalogAuditResult = {
  ok: boolean;
  moduleCount: number;
  errors: string[];
  warnings: string[];
};

export function auditModulesCatalog(expectedCount = 63): ModulesCatalogAuditResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const ids = MODULES.map((m) => m.id);
  const unique = new Set(ids);
  if (unique.size !== ids.length) {
    errors.push(`Duplicate module ids: expected ${ids.length} unique, got ${unique.size}`);
  }

  if (MODULES.length !== expectedCount) {
    errors.push(`MODULES.length = ${MODULES.length}, expected ${expectedCount}`);
  }

  for (const mod of MODULES) {
    validateModuleEntry(mod, errors, warnings);
  }

  return {
    ok: errors.length === 0,
    moduleCount: MODULES.length,
    errors,
    warnings,
  };
}

function validateModuleEntry(mod: ModuleEntry, errors: string[], warnings: string[]): void {
  if (!mod.href && !mod.externalHref && mod.kind !== "education") {
    warnings.push(`${mod.id}: no href or externalHref`);
  }

  if (mod.ref?.catalog === "registry") {
    if (!REGISTRY_CALCULATOR_SLUGS.includes(mod.ref.slug as (typeof REGISTRY_CALCULATOR_SLUGS)[number])) {
      errors.push(`${mod.id}: unknown registry slug "${mod.ref.slug}"`);
    }
  }

  if (mod.ref?.catalog === "appointment") {
    if (!getAppointmentCalculatorById(mod.ref.id)) {
      errors.push(`${mod.id}: unknown appointment id "${mod.ref.id}"`);
    }
  }

  if (mod.kind === "calculator-appointment" && mod.ref?.catalog !== "appointment") {
    errors.push(`${mod.id}: calculator-appointment must ref appointment catalog`);
  }
}

/** Appointment ids present in catalog but not yet in MODULES (informational). */
export function listUnmappedAppointmentCalculators(): string[] {
  const mapped = new Set(
    MODULES.filter((m): m is ModuleEntry & { ref: { catalog: "appointment"; id: string } } =>
      m.ref?.catalog === "appointment",
    ).map((m) => m.ref.id),
  );
  const all = [...APPOINTMENT_CALCULATORS, ...EXTRA_PROJECT_CALCULATORS].map((c) => c.id);
  return all.filter((id) => !mapped.has(id));
}

export function assertModulesCatalogOk(): void {
  const result = auditModulesCatalog();
  if (!result.ok) {
    throw new Error(`modules.catalog audit failed:\n${result.errors.join("\n")}`);
  }
}
