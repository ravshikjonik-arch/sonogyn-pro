import type { SupabaseClient } from "@supabase/supabase-js";

import type { ToolExecutionResult } from "./tools/schemas";

export type AiChatSessionRow = {
  id: string;
  title: string;
  domain: string;
  prompt_version: string | null;
  model_id: string | null;
  updated_at: string;
};

export type AiChatMessageRow = {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  tool_results: ToolExecutionResult[] | null;
  evidence: unknown;
  is_ai_draft: boolean;
  model_id: string | null;
  prompt_version: string | null;
  created_at: string;
};

export async function listChatSessions(
  supabase: SupabaseClient,
  userId: string,
  limit = 30,
): Promise<AiChatSessionRow[]> {
  const { data } = await supabase
    .from("ai_chat_sessions")
    .select("id, title, domain, prompt_version, model_id, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as AiChatSessionRow[];
}

export async function createChatSession(
  supabase: SupabaseClient,
  input: { userId: string; title: string; domain: string },
): Promise<AiChatSessionRow | null> {
  const { data, error } = await supabase
    .from("ai_chat_sessions")
    .insert({
      user_id: input.userId,
      title: input.title.slice(0, 120),
      domain: input.domain,
    })
    .select("id, title, domain, prompt_version, model_id, updated_at")
    .single();
  if (error) return null;
  return data as AiChatSessionRow;
}

export async function touchChatSession(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
  patch?: { title?: string; model_id?: string; prompt_version?: string },
): Promise<void> {
  await supabase
    .from("ai_chat_sessions")
    .update({
      updated_at: new Date().toISOString(),
      ...patch,
    })
    .eq("id", sessionId)
    .eq("user_id", userId);
}

export async function getSessionMessages(
  supabase: SupabaseClient,
  sessionId: string,
  userId: string,
): Promise<AiChatMessageRow[]> {
  const { data: session } = await supabase
    .from("ai_chat_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!session) return [];

  const { data } = await supabase
    .from("ai_chat_messages")
    .select(
      "id, session_id, role, content, tool_results, evidence, is_ai_draft, model_id, prompt_version, created_at",
    )
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  return (data ?? []) as AiChatMessageRow[];
}

export async function appendChatMessage(
  supabase: SupabaseClient,
  input: {
    sessionId: string;
    userId: string;
    role: "user" | "assistant";
    content: string;
    toolResults?: ToolExecutionResult[];
    evidence?: unknown;
    isAiDraft?: boolean;
    modelId?: string;
    promptVersion?: string;
  },
): Promise<string | null> {
  const { data, error } = await supabase
    .from("ai_chat_messages")
    .insert({
      session_id: input.sessionId,
      user_id: input.userId,
      role: input.role,
      content: input.content,
      tool_results: input.toolResults?.length ? input.toolResults : null,
      evidence: input.evidence ?? null,
      is_ai_draft: input.isAiDraft ?? input.role === "assistant",
      model_id: input.modelId ?? null,
      prompt_version: input.promptVersion ?? null,
    })
    .select("id")
    .single();
  if (error) return null;
  return data.id as string;
}
