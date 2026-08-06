"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult, ActionResultWithData } from "@/types/list";
import type { Workspace, WorkspaceRole } from "@/types/workspace";
import { createWorkspace, joinWorkspace } from "@/services/workspace.service";
import { deleteWorkspace } from "@/repositories/workspaces.repository";
import { updateMemberRole, removeMember } from "@/repositories/workspace-members.repository";
import {
  createInvitation,
  revokeInvitation,
} from "@/repositories/workspace-invitations.repository";
import type {
  CreateInvitationInput,
  WorkspaceInvitation,
} from "@/types/invitation";
import { recordAudit } from "@/services/audit.service";

/**
 * Get the authenticated (non-anonymous) user's ID, or null.
 * Used for workspace management — guests can't manage workspaces.
 */
async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.is_anonymous) return null;
  return user.id;
}

/** Create a new workspace with the current user as owner. */
export async function createWorkspaceAction(
  name: string,
): Promise<ActionResultWithData<Workspace>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, error: "No autenticado" };

  try {
    const workspace = await createWorkspace(userId, name);
    refresh();
    return { ok: true, data: workspace };
  } catch {
    return { ok: false, error: "No se pudo crear el workspace" };
  }
}

/** Join a workspace via invite code, then redirect to it. */
export async function joinWorkspaceAction(
  inviteCode: string,
): Promise<ActionResultWithData<Workspace>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, error: "No autenticado" };

  try {
    const workspace = await joinWorkspace(userId, inviteCode);
    if (!workspace) return { ok: false, error: "Código de invitación inválido" };
    refresh();
    return { ok: true, data: workspace };
  } catch {
    return { ok: false, error: "No se pudo unir al workspace" };
  }
}

/** Update workspace details (owner only, enforced by RLS). */
export async function updateWorkspaceAction(
  workspaceId: string,
  patch: { name?: string; description?: string; image_url?: string | null },
): Promise<ActionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, error: "No autenticado" };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("workspaces")
      .update(patch)
      .eq("id", workspaceId);

    if (error) throw error;
    refresh();
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar el workspace" };
  }
}

/**
 * Delete a workspace (owner only, enforced by RLS). Cascades to members, lists,
 * items, invitations, NFC tags and audit logs (FK on delete cascade).
 * Returns ok — the client navigates to "/" which lands on the next workspace.
 * No refresh(): we leave this route entirely. No audit: the cascade wipes the
 * workspace's audit rows alongside it.
 */
export async function deleteWorkspaceAction(
  workspaceId: string,
): Promise<ActionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, error: "No autenticado" };

  try {
    await deleteWorkspace(workspaceId);
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar el workspace" };
  }
}

/** Change a member's role (owner only, enforced by RLS). */
export async function updateMemberRoleAction(
  workspaceId: string,
  memberUserId: string,
  role: WorkspaceRole,
): Promise<ActionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, error: "No autenticado" };

  try {
    await updateMemberRole(workspaceId, memberUserId, role);
    refresh();
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar el rol" };
  }
}

/** Remove a member (owner only, enforced by RLS). */
export async function removeMemberAction(
  workspaceId: string,
  memberUserId: string,
): Promise<ActionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, error: "No autenticado" };

  try {
    await removeMember(workspaceId, memberUserId);
    refresh();
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo remover el miembro" };
  }
}

// ── Invitation management (owner only, enforced by RLS) ──────────────────────

/** Create a new invitation token for a workspace. */
export async function createInvitationAction(
  input: CreateInvitationInput,
): Promise<ActionResultWithData<WorkspaceInvitation>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, error: "No autenticado" };

  try {
    const invitation = await createInvitation(userId, input);
    recordAudit({
      actorType: "user",
      actorId: userId,
      workspaceId: input.workspaceId,
      action: "invitation.create",
      entityType: "workspace_invitation",
      entityId: invitation.id,
      metadata: { role: input.role ?? "EDITOR" },
    });
    refresh();
    return { ok: true, data: invitation };
  } catch {
    return { ok: false, error: "No se pudo crear la invitación" };
  }
}

/** Revoke an invitation (makes the token invalid). */
export async function revokeInvitationAction(
  invitationId: string,
): Promise<ActionResult> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return { ok: false, error: "No autenticado" };

  try {
    await revokeInvitation(invitationId);
    recordAudit({
      actorType: "user",
      actorId: userId,
      action: "invitation.revoke",
      entityType: "workspace_invitation",
      entityId: invitationId,
    });
    refresh();
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo revocar la invitación" };
  }
}
