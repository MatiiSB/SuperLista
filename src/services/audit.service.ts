import { createAdminClient } from "@/lib/supabase/server-admin";

/**
 * Audit logging infrastructure. Records activity to the `audit_logs` table via
 * the service role client. Fire-and-forget — never blocks mutations.
 */

export type AuditActorType = "user" | "guest";

export interface AuditInput {
  workspaceId?: string | null;
  actorType: AuditActorType;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

/**
 * Record an audit log entry. Fire-and-forget: starts the insert and returns
 * immediately. Errors are logged to console but never thrown.
 */
export function recordAudit(input: AuditInput): void {
  void (async () => {
    try {
      const { error } = await createAdminClient()
        .from("audit_logs")
        .insert({
          workspace_id: input.workspaceId ?? null,
          actor_type: input.actorType,
          actor_id: input.actorId ?? null,
          action: input.action,
          entity_type: input.entityType,
          entity_id: input.entityId ?? null,
          metadata: input.metadata ?? {},
        });
      if (error) console.error("[audit] insert failed:", error.message);
    } catch (err) {
      console.error("[audit] error:", err);
    }
  })();
}
