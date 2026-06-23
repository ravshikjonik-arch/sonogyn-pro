import type { SupabaseClient } from "@supabase/supabase-js";

import { evaluateCpiCase } from "../../application/evaluate-case.handler";
import type { CpiCaseInput, CpiEvaluationResult } from "../../domain/schemas";
import { CpiCaseInputSchema } from "../../domain/schemas";

export type CpiCaseRecord = {
  id: string;
  userId: string;
  patientId: string | null;
  status: "draft" | "evaluated" | "archived";
  input: CpiCaseInput;
  evaluation: CpiEvaluationResult | null;
  createdAt: string;
  updatedAt: string;
};

export type CpiPersistResult = {
  caseId: string;
  evaluation: CpiEvaluationResult;
};

type DbCaseRow = {
  id: string;
  user_id: string;
  patient_id: string | null;
  status: "draft" | "evaluated" | "archived";
  input: unknown;
  created_at: string;
  updated_at: string;
};

/** Infrastructure — Supabase persistence for CPI cases (CQRS write side). */
export class SupabaseCpiRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async createAndEvaluate(userId: string, input: CpiCaseInput): Promise<CpiPersistResult> {
    const parsed = CpiCaseInputSchema.parse(input);
    const evaluation = evaluateCpiCase(parsed);

    const { data: caseRow, error: caseErr } = await this.supabase
      .from("cpi_cases")
      .insert({
        user_id: userId,
        patient_id: parsed.patientId ?? null,
        status: "evaluated",
        input: parsed,
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (caseErr || !caseRow) {
      throw new Error(caseErr?.message ?? "Failed to create CPI case");
    }

    const caseId = caseRow.id as string;
    await this.persistEvaluationSnapshot(caseId, parsed, evaluation);
    await this.audit(userId, caseId, "case.evaluated", { risk: evaluation.risk });

    return { caseId, evaluation };
  }

  async getCase(userId: string, caseId: string): Promise<CpiCaseRecord | null> {
    const { data, error } = await this.supabase
      .from("cpi_cases")
      .select("*")
      .eq("id", caseId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    const row = data as DbCaseRow;
    const input = CpiCaseInputSchema.parse(row.input);

    const { data: riskRow } = await this.supabase
      .from("cpi_risk_results")
      .select("payload")
      .eq("case_id", caseId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const evaluation = riskRow?.payload
      ? (riskRow.payload as CpiEvaluationResult)
      : evaluateCpiCase(input);

    return {
      id: row.id,
      userId: row.user_id,
      patientId: row.patient_id,
      status: row.status,
      input,
      evaluation,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async listCases(userId: string, limit = 20): Promise<CpiCaseRecord[]> {
    const { data, error } = await this.supabase
      .from("cpi_cases")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);
    if (!data?.length) return [];

    return Promise.all(
      (data as DbCaseRow[]).map(async (row) => {
        const input = CpiCaseInputSchema.parse(row.input);
        const full = await this.getCase(userId, row.id);
        return (
          full ?? {
            id: row.id,
            userId: row.user_id,
            patientId: row.patient_id,
            status: row.status,
            input,
            evaluation: evaluateCpiCase(input),
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }
        );
      }),
    );
  }

  private async persistEvaluationSnapshot(
    caseId: string,
    input: CpiCaseInput,
    evaluation: CpiEvaluationResult,
  ): Promise<void> {
    const results = await Promise.all([
      this.supabase.from("cpi_colposcopy").insert({ case_id: caseId, payload: input.colposcopy }),
      this.supabase.from("cpi_hpv").insert({ case_id: caseId, payload: input.hpv }),
      this.supabase.from("cpi_cytology").insert({ case_id: caseId, payload: input.cytology }),
      this.supabase.from("cpi_histology").insert({ case_id: caseId, payload: input.histology }),
      this.supabase.from("cpi_risk_results").insert({
        case_id: caseId,
        cin1_risk: evaluation.risk.cin1Risk,
        cin2_plus_risk: evaluation.risk.cin2PlusRisk,
        cin3_plus_risk: evaluation.risk.cin3PlusRisk,
        ais_risk: evaluation.risk.aisRisk,
        invasion_risk: evaluation.risk.invasionRisk,
        confidence_score: evaluation.risk.confidenceScore,
        payload: evaluation,
      }),
      this.supabase.from("cpi_decisions").insert({
        case_id: caseId,
        actions: evaluation.actions,
        explanation: evaluation.explanation,
        evidence: evaluation.actions.flatMap((a) => a.evidence),
        guideline_references: evaluation.actions.flatMap((a) => a.references),
      }),
    ]);

    for (const r of results) {
      if (r.error) throw new Error(r.error.message);
    }
  }

  async saveReport(
    caseId: string,
    format: "html" | "pdf" | "docx",
    content: string,
  ): Promise<string> {
    const { data, error } = await this.supabase
      .from("cpi_reports")
      .insert({ case_id: caseId, format, content })
      .select("id")
      .single();

    if (error || !data) throw new Error(error?.message ?? "Failed to save report");
    return data.id as string;
  }

  private async audit(userId: string, caseId: string, action: string, meta: Record<string, unknown>) {
    await this.supabase.from("cpi_audit_log").insert({
      user_id: userId,
      case_id: caseId,
      action,
      meta,
    });
  }
}
