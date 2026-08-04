/**
 * Workspace invitation domain types.
 */

export type InvitationRole = "EDITOR" | "VIEWER";

export interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  token: string;
  created_by: string;
  role: InvitationRole;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  revoked_at: string | null;
  created_at: string;
  last_used_at: string | null;
}

/** Options for creating a new invitation. */
export interface CreateInvitationInput {
  workspaceId: string;
  role?: InvitationRole;
  expiresAt?: string | null;
  maxUses?: number | null;
}
