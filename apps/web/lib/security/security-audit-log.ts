import { createClient } from "@/utils/supabase/server";
import { safeLog } from "./safeLog";

export type SecurityAuditCategory =
  | "auth"
  | "admin"
  | "webhook"
  | "author"
  | "moderation"
  | "report";

export type SecurityAuditInput = {
  category: SecurityAuditCategory;
  action: string;
  resource?: string;
  resourceId?: string;
  success?: boolean;
  metadata?: Record<string, unknown>;
};

export async function writeSecurityAuditLog(input: SecurityAuditInput): Promise<void> {
  const supabase = await createClient();
  if (!supabase) {
    safeLog("security audit skipped: no supabase client", { category: input.category, action: input.action });
    return;
  }

  let actorId: string | null = null;
  const actorRole: string | null = null;
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    actorId = user?.id ?? null;
  } catch {
    actorId = null;
  }

  try {
    const { data, error } = await supabase
      .from("security_audit_log")
      .insert({
        actor_id: actorId,
        actor_role: actorRole,
        ip_hash: "",
        user_agent: "",
        category: input.category,
        action: input.action,
        resource: input.resource ?? null,
        resource_id: input.resourceId ?? null,
        success: input.success ?? true,
        metadata: {
          ...(input.metadata ?? {}),
          environment: process.env.NODE_ENV,
        },
      })
      .select("id")
      .maybeSingle();

    if (error) {
      safeLog("security audit insert error", { code: error.code, message: error.message });
    }
  } catch (error) {
    safeLog("security audit log fatal", {
      message: error instanceof Error ? error.message : "unknown",
    });
  }
}
