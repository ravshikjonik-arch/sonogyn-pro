import type { CalculatorDefinition } from "./registry";

export function resolveCalculatorHref(definition: CalculatorDefinition): string {
  if (definition.externalHref) return definition.externalHref;
  return `/calculators/${definition.slug}`;
}
