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
    const { error } = await supabase.rpc("insert_security_audit_event", {
      p_category: input.category,
      p_action: input.action,
      p_resource: input.resource ?? null,
      p_resource_id: input.resourceId ?? null,
      p_success: input.success ?? true,
      p_metadata: {
        ...(input.metadata ?? {}),
        environment: process.env.NODE_ENV,
      },
      p_request_id: null,
    });

    if (error) {
      safeLog("security audit insert error", { code: error.code, message: error.message });
    }
  } catch (error) {
    safeLog("security audit log fatal", {
      message: error instanceof Error ? error.message : "unknown",
    });
  }
}
