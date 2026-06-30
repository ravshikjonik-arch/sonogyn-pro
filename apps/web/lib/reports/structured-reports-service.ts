import {
  ADNEX_ORADS_V1_TEMPLATE,
  ADNEX_ORADS_V1_TEMPLATE_SLUG,
  generateStructuredReportFromRequest,
  OBSTETRIC_BIOMETRY_V1_TEMPLATE,
  renderAdnexStructuredDocument,
  renderObstetricStructuredDocument,
  renderThyroidStructuredDocument,
  THYROID_TIRADS_V1_TEMPLATE,
} from "@repo/report-engine";
import type {
  GenerateStructuredReportRequest,
  ListReportTemplatesQuery,
  ReportCitation,
  ReportTemplate,
  StructuredReportDocument,
  StructuredReportOutput,
  UpdateStructuredReportBody,
} from "@repo/types";
import {
  GenerateStructuredReportRequestSchema,
  StructuredReportDocumentSchema,
  StructuredReportInputSchema,
  StructuredReportOutputSchema,
  UpdateStructuredReportBodySchema,
} from "@repo/types";
import type { SupabaseClient } from "@supabase/supabase-js";

import { fetchEvidenceForReportInput } from "@/lib/reports/fetch-report-evidence";

type DbTemplateRow = {
  id: string;
  slug: string;
  domain: string;
  version: string;
  locales: string[];
  schema_json: Record<string, unknown>;
  engine_id: string;
  title_key: string | null;
  description_key: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type DbReportRow = {
  id: string;
  user_id: string;
  patient_id: string | null;
  study_id: string | null;
  template_id: string;
  status: StructuredReportDocument["status"];
  input_json: unknown;
  output_json: unknown;
  edited_blocks_json: Record<string, unknown>;
  locale: StructuredReportDocument["locale"];
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
};

type DbCitationRow = {
  id: string;
  report_id: string;
  corpus_id: string;
  label: string;
  url: string | null;
};

const STATIC_TEMPLATES: ReportTemplate[] = [
  ADNEX_ORADS_V1_TEMPLATE,
  THYROID_TIRADS_V1_TEMPLATE,
  OBSTETRIC_BIOMETRY_V1_TEMPLATE,
];

function mapDbTemplate(row: DbTemplateRow): ReportTemplate {
  const schemaFields = row.schema_json?.fields;
  const fields = Array.isArray(schemaFields) ? schemaFields : [];

  return {
    id: row.id,
    slug: row.slug,
    domain: row.domain as ReportTemplate["domain"],
    version: row.version,
    engineId: row.engine_id,
    locales: row.locales.filter((l): l is ReportTemplate["locales"][number] => l === "ru" || l === "en"),
    titleKey: row.title_key ?? row.slug,
    descriptionKey: row.description_key ?? undefined,
    fields: fields as ReportTemplate["fields"],
    isActive: row.is_active,
  };
}

export function getStaticTemplateBySlug(slug: string): ReportTemplate | null {
  return STATIC_TEMPLATES.find((t) => t.slug === slug) ?? null;
}

export async function listReportTemplates(
  supabase: SupabaseClient,
  query: ListReportTemplatesQuery,
): Promise<ReportTemplate[]> {
  let dbQuery = supabase.from("report_templates").select("*");

  if (query.activeOnly) {
    dbQuery = dbQuery.eq("is_active", true);
  }
  if (query.domain) {
    dbQuery = dbQuery.eq("domain", query.domain);
  }
  if (query.locale) {
    dbQuery = dbQuery.contains("locales", [query.locale]);
  }

  const { data, error } = await dbQuery.order("slug", { ascending: true });

  if (error) {
    if (error.code === "42P01") {
      return filterStaticTemplates(query);
    }
    throw new Error(error.message);
  }

  const rows = (data ?? []) as DbTemplateRow[];
  if (rows.length === 0) {
    return filterStaticTemplates(query);
  }

  return rows.map(mapDbTemplate);
}

function filterStaticTemplates(query: ListReportTemplatesQuery): ReportTemplate[] {
  return STATIC_TEMPLATES.filter((t) => {
    if (query.activeOnly && !t.isActive) return false;
    if (query.domain && t.domain !== query.domain) return false;
    if (query.locale && !t.locales.includes(query.locale)) return false;
    return true;
  });
}

export async function resolveTemplateBySlug(
  supabase: SupabaseClient,
  slug: string,
): Promise<ReportTemplate | null> {
  const { data, error } = await supabase
    .from("report_templates")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    if (error.code === "42P01") {
      return getStaticTemplateBySlug(slug);
    }
    throw new Error(error.message);
  }

  if (data) {
    return mapDbTemplate(data as DbTemplateRow);
  }

  return getStaticTemplateBySlug(slug);
}

export function generateReportDocument(
  request: Omit<GenerateStructuredReportRequest, "preview"> & { preview?: boolean },
): StructuredReportDocument {
  const parsed = GenerateStructuredReportRequestSchema.parse({
    preview: false,
    ...request,
  });
  return generateStructuredReportFromRequest(parsed);
}

export async function generateReportDocumentAsync(
  request: Omit<GenerateStructuredReportRequest, "preview"> & { preview?: boolean },
): Promise<StructuredReportDocument> {
  const parsed = GenerateStructuredReportRequestSchema.parse({
    preview: false,
    ...request,
  });

  const enrich =
    process.env.EVIDENCE_ENRICH_REPORTS !== "0" && process.env.EVIDENCE_ENRICH_REPORTS !== "false";
  const evidenceRecords = enrich ? await fetchEvidenceForReportInput(parsed.input) : [];

  const renderOpts = {
    locale: parsed.locale,
    templateSlug: parsed.templateSlug,
    evidenceRecords,
  };

  switch (parsed.input.domain) {
    case "adnex":
      return renderAdnexStructuredDocument(parsed.input, renderOpts);
    case "thyroid":
      return renderThyroidStructuredDocument(parsed.input, renderOpts);
    case "obstetric":
      return renderObstetricStructuredDocument(parsed.input, renderOpts);
    default:
      return generateStructuredReportFromRequest(parsed);
  }
}

function mergeEditedBlocks(
  output: StructuredReportOutput,
  editedBlocks: StructuredReportDocument["editedBlocks"],
): StructuredReportOutput {
  return {
    ...output,
    description: editedBlocks.description ?? output.description,
    impression: editedBlocks.impression ?? output.impression,
    recommendations: editedBlocks.recommendations ?? output.recommendations,
  };
}

export function rowToStructuredReportDocument(
  row: DbReportRow,
  templateSlug: string,
  citations: ReportCitation[] = [],
): StructuredReportDocument {
  const input = StructuredReportInputSchema.parse(row.input_json);
  const output = StructuredReportOutputSchema.parse(row.output_json);
  const editedBlocks = row.edited_blocks_json ?? {};

  const mergedOutput = mergeEditedBlocks(output, editedBlocks);
  if (citations.length > 0) {
    mergedOutput.citations = citations;
  }

  return StructuredReportDocumentSchema.parse({
    version: "2026.1",
    id: row.id,
    status: row.status,
    templateSlug,
    locale: row.locale,
    input,
    output: mergedOutput,
    editedBlocks,
    findings: [],
  });
}

export async function persistStructuredReport(
  supabase: SupabaseClient,
  userId: string,
  document: StructuredReportDocument,
  templateId: string,
  opts: { patientId?: string | null; studyId?: string | null } = {},
): Promise<string> {
  const { data, error } = await supabase
    .from("structured_reports")
    .insert({
      user_id: userId,
      template_id: templateId,
      patient_id: opts.patientId ?? null,
      study_id: opts.studyId ?? null,
      status: document.status,
      input_json: document.input,
      output_json: document.output,
      edited_blocks_json: document.editedBlocks,
      locale: document.locale,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to persist structured report");
  }

  const reportId = data.id as string;
  const citations = document.output.citations ?? [];

  if (citations.length > 0) {
    const { error: citeError } = await supabase.from("report_citation_links").insert(
      citations.map((c) => ({
        report_id: reportId,
        corpus_id: c.id,
        label: c.label,
        url: c.url ?? null,
      })),
    );

    if (citeError) {
      throw new Error(citeError.message);
    }
  }

  return reportId;
}

export async function getStructuredReportById(
  supabase: SupabaseClient,
  userId: string,
  reportId: string,
): Promise<{ document: StructuredReportDocument; row: DbReportRow; templateSlug: string } | null> {
  const { data, error } = await supabase
    .from("structured_reports")
    .select("*")
    .eq("id", reportId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;

  const row = data as DbReportRow;

  const { data: templateRow } = await supabase
    .from("report_templates")
    .select("slug")
    .eq("id", row.template_id)
    .maybeSingle();

  const templateSlug =
    (templateRow as { slug?: string } | null)?.slug ??
    (row.input_json as { domain?: string }).domain === "adnex"
      ? ADNEX_ORADS_V1_TEMPLATE_SLUG
      : "unknown";

  const { data: citationRows } = await supabase
    .from("report_citation_links")
    .select("corpus_id, label, url")
    .eq("report_id", reportId);

  const citations: ReportCitation[] = ((citationRows ?? []) as Pick<DbCitationRow, "corpus_id" | "label" | "url">[]).map(
    (c) => ({
      id: c.corpus_id,
      standard: c.label,
      label: c.label,
      url: c.url ?? undefined,
    }),
  );

  return {
    row,
    templateSlug,
    document: rowToStructuredReportDocument(row, templateSlug, citations),
  };
}

export async function updateStructuredReport(
  supabase: SupabaseClient,
  userId: string,
  reportId: string,
  body: UpdateStructuredReportBody,
): Promise<{ document: StructuredReportDocument; templateSlug: string } | null> {
  const parsed = UpdateStructuredReportBodySchema.parse(body);
  const existing = await getStructuredReportById(supabase, userId, reportId);
  if (!existing) return null;

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (parsed.editedBlocks) {
    patch.edited_blocks_json = {
      ...existing.row.edited_blocks_json,
      ...parsed.editedBlocks,
    };
  }

  if (parsed.output) {
    const currentOutput =
      typeof existing.row.output_json === "object" && existing.row.output_json !== null
        ? (existing.row.output_json as Record<string, unknown>)
        : {};
    patch.output_json = {
      ...currentOutput,
      ...parsed.output,
    };
  }

  if (parsed.status) {
    patch.status = parsed.status;
    if (parsed.status === "finalized") {
      patch.finalized_at = new Date().toISOString();
    }
    if (parsed.status === "draft" || parsed.status === "edited") {
      patch.finalized_at = null;
    }
  }

  const { data, error } = await supabase
    .from("structured_reports")
    .update(patch)
    .eq("id", reportId)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;

  const row = data as DbReportRow;
  return {
    templateSlug: existing.templateSlug,
    document: rowToStructuredReportDocument(row, existing.templateSlug),
  };
}

export { UpdateStructuredReportBodySchema };
