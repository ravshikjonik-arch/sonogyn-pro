"use server";

import { revalidatePath } from "next/cache";

import type { UltrasoundProtocolPayload } from "@repo/types";

import { createClient } from "@/utils/supabase/server";

const ASSISTANT_MARKER = "--- Маршрут помощника врача ---";

export type SaveAssistantProtocolResult =
  | { ok: true; studyId: string; measurementId: string }
  | { ok: true; studyId: null; storedIn: "patient_meta" }
  | { ok: false; message: string };

function appendAssistantBlock(existing: string | undefined, block: string): string {
  const base = (existing ?? "").trim();
  if (base.includes(ASSISTANT_MARKER)) {
    const head = base.split(ASSISTANT_MARKER)[0]?.trim() ?? "";
    return head ? `${head}\n\n${block}` : block;
  }
  return base ? `${base}\n\n${block}` : block;
}

export async function saveAssistantRouteToPatient(input: {
  patientId: string;
  studyId?: string;
  text: string;
}): Promise<SaveAssistantProtocolResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, message: "Требуется вход в аккаунт" };

  const text = input.text.trim();
  if (!text) return { ok: false, message: "Пустой маршрут" };

  const { data: patient } = await supabase
    .from("patients")
    .select("id,meta")
    .eq("id", input.patientId)
    .eq("created_by", user.id)
    .maybeSingle();

  if (!patient) return { ok: false, message: "Пациентка не найдена" };

  const block = `${ASSISTANT_MARKER}\n${text}`;

  let studyId = input.studyId;
  if (!studyId) {
    const { data: latest } = await supabase
      .from("studies")
      .select("id")
      .eq("patient_id", input.patientId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    studyId = latest?.id;
  }

  if (studyId) {
    const { data: study } = await supabase.from("studies").select("id,patient_id").eq("id", studyId).maybeSingle();
    if (!study || study.patient_id !== input.patientId) {
      return { ok: false, message: "Исследование не привязано к этой пациентке" };
    }

    const { data: existing } = await supabase
      .from("measurements")
      .select("id,payload")
      .eq("study_id", studyId)
      .eq("kind", "ultrasound_protocol")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const prev = (existing?.payload ?? {}) as UltrasoundProtocolPayload;
    const next: UltrasoundProtocolPayload = {
      study_date: prev.study_date ?? new Date().toISOString().slice(0, 10),
      biometry: prev.biometry ?? {},
      doppler: prev.doppler ?? {},
      amniotic: prev.amniotic ?? {},
      organs: prev.organs ?? {},
      diagnosis: prev.diagnosis,
      conclusion: appendAssistantBlock(prev.conclusion, block),
      efw_grams: prev.efw_grams,
      efw_formula: prev.efw_formula,
      uterus_visualization: prev.uterus_visualization,
    };

    let measurementId: string;
    if (existing?.id) {
      const { error } = await supabase.from("measurements").update({ payload: next }).eq("id", existing.id);
      if (error) return { ok: false, message: error.message };
      measurementId = existing.id;
    } else {
      const { data: inserted, error } = await supabase
        .from("measurements")
        .insert({
          study_id: studyId,
          kind: "ultrasound_protocol",
          payload: next,
          source: "assistant",
          created_by: user.id,
        })
        .select("id")
        .single();
      if (error || !inserted) return { ok: false, message: error?.message ?? "Не удалось создать протокол" };
      measurementId = inserted.id;
    }

    const { data: studyRow } = await supabase.from("studies").select("meta").eq("id", studyId).maybeSingle();
    const studyMeta = (studyRow?.meta ?? {}) as Record<string, unknown>;

    await supabase
      .from("studies")
      .update({
        meta: { ...studyMeta, last_protocol_at: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      })
      .eq("id", studyId);

    revalidatePath(`/workspace/${studyId}`);
    revalidatePath(`/patients/${input.patientId}`);
    return { ok: true, studyId, measurementId };
  }

  const meta = (patient.meta ?? {}) as Record<string, unknown>;
  const routes = Array.isArray(meta.assistant_routes) ? [...meta.assistant_routes] : [];
  routes.unshift({
    saved_at: new Date().toISOString(),
    text: block,
  });

  const { error } = await supabase
    .from("patients")
    .update({
      meta: { ...meta, assistant_routes: routes.slice(0, 20), assistant_protocol_draft: block },
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.patientId);

  if (error) return { ok: false, message: error.message };

  revalidatePath(`/patients/${input.patientId}`);
  return { ok: true, studyId: null, storedIn: "patient_meta" };
}
