import type { SupabaseClient } from "@supabase/supabase-js";

type Row = Record<string, unknown>;

/** In-memory Supabase mock for CPI repository integration tests. */
export function createMockSupabaseClient(): SupabaseClient & { __tables: Map<string, Row[]> } {
  const tables = new Map<string, Row[]>([
    ["cpi_cases", []],
    ["cpi_colposcopy", []],
    ["cpi_hpv", []],
    ["cpi_cytology", []],
    ["cpi_histology", []],
    ["cpi_risk_results", []],
    ["cpi_decisions", []],
    ["cpi_reports", []],
    ["cpi_audit_log", []],
  ]);

  function store(table: string): Row[] {
    if (!tables.has(table)) tables.set(table, []);
    return tables.get(table)!;
  }

  function buildSelect(table: string) {
    const filters: [string, unknown][] = [];
    let orderCol: string | null = null;
    let orderAsc = true;
    let limitN: number | null = null;

    const api = {
      eq(col: string, val: unknown) {
        filters.push([col, val]);
        return api;
      },
      order(col: string, opts?: { ascending?: boolean }) {
        orderCol = col;
        orderAsc = opts?.ascending !== false;
        return api;
      },
      limit(n: number) {
        limitN = n;
        return api;
      },
      async single() {
        const list = store(table).filter((r) => filters.every(([k, v]) => r[k] === v));
        if (list.length !== 1) return { data: null, error: { message: "not found" } };
        return { data: list[0], error: null };
      },
      async maybeSingle() {
        const list = store(table).filter((r) => filters.every(([k, v]) => r[k] === v));
        if (list.length === 0) return { data: null, error: null };
        return { data: list[0], error: null };
      },
      then(onFulfilled: (v: { data: Row[]; error: null }) => unknown, onRejected?: (e: unknown) => unknown) {
        let list = store(table).filter((r) => filters.every(([k, v]) => r[k] === v));
        if (orderCol) {
          list = [...list].sort((a, b) => {
            const av = a[orderCol!];
            const bv = b[orderCol!];
            if (av === bv) return 0;
            return (av! > bv! ? 1 : -1) * (orderAsc ? 1 : -1);
          });
        }
        if (limitN !== null) list = list.slice(0, limitN);
        return Promise.resolve({ data: list, error: null }).then(onFulfilled, onRejected);
      },
    };
    return api;
  }

  function buildInsert(table: string, data: Row | Row[]) {
    const items = Array.isArray(data) ? data : [data];
    const inserted: Row[] = items.map((item) => {
      const row = { id: crypto.randomUUID(), ...item };
      store(table).push(row);
      return row;
    });

    return {
      select(_cols: string) {
        return {
          async single() {
            return { data: { id: inserted[0]!.id }, error: null };
          },
        };
      },
      then(onFulfilled: (v: { error: null }) => unknown, onRejected?: (e: unknown) => unknown) {
        return Promise.resolve({ error: null }).then(onFulfilled, onRejected);
      },
    };
  }

  const client = {
    __tables: tables,
    from(table: string) {
      return {
        insert(data: Row | Row[]) {
          return buildInsert(table, data);
        },
        select(_cols: string) {
          return buildSelect(table);
        },
      };
    },
  };

  return client as unknown as SupabaseClient & { __tables: Map<string, Row[]> };
}
