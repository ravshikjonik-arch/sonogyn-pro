import { NextResponse } from "next/server";
import { z } from "zod";

import { isDevSkipAuthEnabled } from "@/lib/auth/dev-account";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { RL } from "@/lib/security/rate-limit-config";
import { requireSupabaseUserFromRequest } from "@/lib/security/require-user";
import { isUuid } from "@/lib/security/uuid";
import { createClient } from "@/utils/supabase/server";
import type { OradsClinicalMemoryInsight } from "@repo/orads-us";

export const runtime = "nodejs";

const OradsMemoryBodySchema = z.object({
  patientId: z.string().uuid().optional(),
  aiCategoryNumber: z.number().int().min(0).max(5).nullable().optional(),
  extracted: z.record(z.string(), z.unknown()).optional(),
  unresolvedNodes: z.array(z.string().max(120)).max(32).optional(),
});

type OradsMemoryRow = {
  patient_id: string | null;
  extracted: Record<string, unknown> | null;
  unresolved_nodes: string[] | null;
  ai_category_number: number | null;
  manual_category_number: number | null;
  feedback_correct: boolean | null;
  feedback_note: string | null;
  created_at: string;
};

type ClinicalMemoryRow = {
  id: string;
  patient_id: string | null;
  memory_type: string;
  title: string;
  detail: string;
  confidence: "low" | "medium" | "high";
  created_at: string;
};

function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  return error?.code === "42P01" || /clinical_ai_memory/i.test(error?.message ?? "");
}

function sameFeature(a: unknown, b: unknown): boolean {
  return a !== undefined && b !== undefined && a === b;
}

function currentLooksSimilar(current: Record<string, unknown>, past: Record<string, unknown> | null): boolean {
  if (!past) return false;
  let score = 0;
  for (const key of ["lesionClass", "structure", "locularity", "solidComponent", "vascularity", "contour", "menopause"]) {
    if (sameFeature(current[key], past[key])) score += 1;
  }
  const currentSize = typeof current.diameterMm === "number" ? current.diameterMm : null;
  const pastSize = typeof past.diameterMm === "number" ? past.diameterMm : null;
  if (currentSize !== null && pastSize !== null && Math.abs(currentSize - pastSize) <= 20) score += 1;
  return score >= 2;
}

function topCounts(values: string[]): Array<[string, number]> {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireSupabaseUserFromRequest(request, supabase);
  if (!auth.ok) {
    if (isDevSkipAuthEnabled()) return NextResponse.json({ insights: [], dev: true });
    return auth.response;
  }

  const rl = await consumeRateLimit(`ai-orads-memory:${auth.userId}`, RL.aiOrads.limit, RL.aiOrads.windowMs);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = OradsMemoryBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;
  if (body.patientId && !isUuid(body.patientId)) {
    return NextResponse.json({ error: "Invalid patientId" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("ai_orads_events")
    .select(
      "patient_id,extracted,unresolved_nodes,ai_category_number,manual_category_number,feedback_correct,feedback_note,created_at",
    )
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data ?? []) as OradsMemoryRow[];
  const insights: OradsClinicalMemoryInsight[] = [];
  const currentExtracted = body.extracted ?? {};

  let manualMemoryQuery = supabase
    .from("clinical_ai_memory")
    .select("id,patient_id,memory_type,title,detail,confidence,created_at")
    .eq("user_id", auth.userId)
    .eq("domain", "orads")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(8);

  if (body.patientId) manualMemoryQuery = manualMemoryQuery.or(`patient_id.eq.${body.patientId},patient_id.is.null`);
  else manualMemoryQuery = manualMemoryQuery.is("patient_id", null);

  const { data: manualMemory, error: manualMemoryError } = await manualMemoryQuery;
  if (manualMemoryError && !isMissingTableError(manualMemoryError)) {
    return NextResponse.json({ error: manualMemoryError.message }, { status: 500 });
  }

  for (const item of ((manualMemory ?? []) as ClinicalMemoryRow[]).slice(0, 2)) {
    insights.push({
      scope: item.patient_id ? "patient" : "doctor",
      title: item.title,
      detail: item.detail,
      weight: item.confidence,
    });
  }

  if (body.patientId) {
    const patientRows = rows.filter((row) => row.patient_id === body.patientId);
    const lastPatientRow = patientRows[0];
    if (patientRows.length > 0) {
      insights.push({
        scope: "patient",
        title: "Память пациентки",
        detail:
          lastPatientRow?.manual_category_number != null
            ? `У этой пациентки уже было ${patientRows.length} O-RADS разбор(ов); последняя врачебная категория: O-RADS ${lastPatientRow.manual_category_number}. Сравните динамику и признаки.`
            : `У этой пациентки уже было ${patientRows.length} O-RADS разбор(ов). Сравните с предыдущими признаками и размерами.`,
        weight: patientRows.length >= 2 ? "high" : "medium",
      });
    }
  }

  const corrected = rows.filter((row) => row.feedback_correct === false && row.manual_category_number != null);
  const similarCorrections = corrected.filter((row) => currentLooksSimilar(currentExtracted, row.extracted));
  const correctionPool = similarCorrections.length ? similarCorrections : corrected;
  const correctionPairs = correctionPool
    .filter((row) => row.ai_category_number != null && row.manual_category_number != null)
    .map((row) => `O-RADS ${row.ai_category_number} -> ${row.manual_category_number}`);
  const topCorrection = topCounts(correctionPairs)[0];

  if (topCorrection) {
    insights.push({
      scope: "doctor",
      title: similarCorrections.length ? "Похожее исправление врача" : "Паттерн исправлений врача",
      detail: `В вашей памяти ${topCorrection[1]} раз(а) встречалось исправление ${topCorrection[0]}. Проверьте признаки, которые могли занизить или завысить категорию.`,
      weight: topCorrection[1] >= 2 ? "high" : "medium",
    });
  }

  const unresolved = rows.flatMap((row) => (Array.isArray(row.unresolved_nodes) ? row.unresolved_nodes : []));
  const topUnresolved = topCounts(unresolved)[0];
  if (topUnresolved) {
    insights.push({
      scope: "doctor",
      title: "Часто незакрытый признак",
      detail: `В ваших прошлых разборах часто не хватало узла ${topUnresolved[0]}. Обратите внимание, не повторяется ли это сейчас.`,
      weight: topUnresolved[1] >= 3 ? "high" : "low",
    });
  }

  if (body.unresolvedNodes?.length) {
    insights.push({
      scope: "system",
      title: "Текущий разбор неполный",
      detail: `Сейчас не закрыты: ${body.unresolvedNodes.slice(0, 5).join(", ")}. Память не должна подменять эти признаки, их нужно проверить на изображении.`,
      weight: "high",
    });
  }

  return NextResponse.json({ insights: insights.slice(0, 5) });
}
