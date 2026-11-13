/**
 * Missing-data semantics for chat clinical tools.
 *
 * Unknown inputs are never filled in. Instead the SSOT engine itself is re-run over every value an
 * unknown input can take; if the outcome changes, the result is not complete. No classification
 * criteria live here — only enumeration of engine inputs and comparison of engine outputs.
 */

export type CompletenessStatus = "complete" | "provisional" | "incomplete";

export type SectionCompleteness = {
  status: CompletenessStatus;
  /** Required for this result and not provided. */
  missing?: string[];
  /** Explicitly reported as not assessed. */
  notAssessed?: string[];
  /** Not provided; the engine evaluates them as "absent / no". */
  assumedAbsent?: string[];
  /** Distinct engine outcomes over every value of the unknown inputs. */
  possibleOutcomes?: string[];
  reason?: string;
};

export type ToolCompleteness = {
  /** Category / risk estimate / measurement assessment. */
  category: SectionCompleteness;
  /** Management recommendation (FNA, follow-up) when the engine returns one. */
  recommendation?: SectionCompleteness;
};

export type Probe<I> = { field: keyof I & string; values: readonly unknown[] };

/** Above this the enumeration is not attempted and the result is reported as incomplete. */
export const MAX_PROBE_COMBINATIONS = 5000;

const RANK: Record<CompletenessStatus, number> = { complete: 0, provisional: 1, incomplete: 2 };

export function worstStatus(...statuses: (CompletenessStatus | undefined)[]): CompletenessStatus {
  return statuses.reduce<CompletenessStatus>(
    (acc, s) => (s && RANK[s] > RANK[acc] ? s : acc),
    "complete",
  );
}

export function combinationCount<I>(probes: readonly Probe<I>[]): number {
  return probes.reduce((n, p) => n * Math.max(1, p.values.length), 1);
}

/** Every assignment of probe values over `base`; `undefined` removes the key (= not provided). */
export function assignments<I extends object>(base: I, probes: readonly Probe<I>[]): I[] {
  let acc: Record<string, unknown>[] = [{ ...(base as Record<string, unknown>) }];
  for (const probe of probes) {
    const next: Record<string, unknown>[] = [];
    for (const partial of acc) {
      for (const value of probe.values) {
        const copy = { ...partial };
        if (value === undefined) delete copy[probe.field];
        else copy[probe.field] = value;
        next.push(copy);
      }
    }
    acc = next;
  }
  return acc as I[];
}

export function distinct(values: readonly string[]): string[] {
  return [...new Set(values)];
}

/** Probe fields whose variation alone (others as provided) changes the outcome key. */
export function sensitiveFields<I extends object, R>(
  base: I,
  probes: readonly Probe<I>[],
  run: (input: I) => R,
  key: (result: R) => string,
): Map<string, string[]> {
  const baseKey = key(run(base));
  const out = new Map<string, string[]>();
  for (const probe of probes) {
    const keys = distinct(assignments(base, [probe]).map((i) => key(run(i))));
    if (keys.some((k) => k !== baseKey)) out.set(probe.field, keys.filter((k) => k !== baseKey));
  }
  return out;
}

/** Top-level keys whose JSON value is identical in every result. */
export function invariantProjection(results: readonly Record<string, unknown>[]): Record<string, unknown> {
  const [first, ...rest] = results;
  if (!first) return {};
  const projected: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(first)) {
    const json = JSON.stringify(v);
    if (rest.every((r) => JSON.stringify(r[k]) === json)) projected[k] = v;
  }
  return projected;
}

export function omitKeys(obj: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));
}

export function nonEmptySubsets<T>(items: readonly T[]): T[][] {
  const out: T[][] = [];
  for (let mask = 1; mask < 1 << items.length; mask++) {
    out.push(items.filter((_, i) => mask & (1 << i)));
  }
  return out;
}

export function allSubsets<T>(items: readonly T[]): T[][] {
  return [[], ...nonEmptySubsets(items)];
}
