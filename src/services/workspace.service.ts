import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server-admin";
import type { Workspace } from "@/types/workspace";

/**
 * Business logic for workspace creation and joining.
 * Uses the admin client to bypass RLS where needed (joining via invite code).
 */

/** Generate a random invite code like ABCD-91XF. */
function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const part = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * 36)]).join(
      "",
    );
  return `${part()}-${part()}`;
}

/**
 * Create a workspace with the given user as owner, add them as a OWNER member,
 * and create a default shopping list. Retries on invite code collision.
 */
export async function createWorkspace(
  userId: string,
  name: string,
): Promise<Workspace> {
  const supabase = await createClient();

  // Retry loop for invite code collisions (extremely unlikely).
  for (let attempt = 0; attempt < 3; attempt++) {
    const inviteCode = generateInviteCode();

    const { data: workspace, error } = await supabase
      .from("workspaces")
      .insert({
        owner_id: userId,
        name,
        invite_code: inviteCode,
      })
      .select("*")
      .single();

    if (error) {
      // Unique violation on invite_code → retry with a new code.
      if (error.code === "23505") continue;
      throw error;
    }

    const ws = workspace as Workspace;

    // Add the user as OWNER member.
    const { error: memberError } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: ws.id,
        user_id: userId,
        role: "OWNER",
      });

    if (memberError) throw memberError;

    // Create a default shopping list.
    const { error: listError } = await supabase
      .from("shopping_lists")
      .insert({
        workspace_id: ws.id,
        name: "Lista",
        is_default: true,
      });

    if (listError) throw listError;

    return ws;
  }

  throw new Error("No se pudo generar un código de invitación único");
}

/**
 * Join a workspace via invite code. Uses the admin client to look up the
 * workspace (the user is not yet a member, so RLS would block the query) and
 * to insert the membership (RLS only allows the owner to add members).
 *
 * Returns the workspace, or null if the invite code is invalid.
 */
export async function joinWorkspace(
  userId: string,
  inviteCode: string,
): Promise<Workspace | null> {
  const admin = createAdminClient();

  // Look up the workspace by invite code (bypasses RLS).
  const { data: workspace, error } = await admin
    .from("workspaces")
    .select("*")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (error) throw error;
  if (!workspace) return null;

  const ws = workspace as Workspace;

  // Check if already a member.
  const { data: existing } = await admin
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", ws.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return ws; // Already a member — no-op.

  // Add as EDITOR (can contribute but not manage).
  const { error: insertError } = await admin
    .from("workspace_members")
    .insert({
      workspace_id: ws.id,
      user_id: userId,
      role: "EDITOR",
    });

  if (insertError) throw insertError;

  return ws;
}

/** Look up a workspace by invite code (admin client, for display before joining). */
export async function getWorkspaceByInviteCode(
  inviteCode: string,
): Promise<Workspace | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("workspaces")
    .select("id, name, description, image_url")
    .eq("invite_code", inviteCode)
    .maybeSingle();

  if (error) throw error;
  return data as Workspace | null;
}

/**
 * Join a workspace via a UUID invitation token. Validates the token (not
 * revoked, not expired, under max_uses), adds the user as a member with the
 * invitation's role, and increments use_count.
 *
 * Returns the workspace, or null if the token is invalid.
 */
export async function joinWorkspaceViaInvitation(
  userId: string,
  token: string,
): Promise<Workspace | null> {
  const admin = createAdminClient();

  // Look up the invitation (bypasses RLS — user is not yet a member).
  const { data: invitation, error } = await admin
    .from("workspace_invitations")
    .select("id, workspace_id, role, revoked_at, expires_at, max_uses, use_count")
    .eq("token", token)
    .maybeSingle();

  if (error) throw error;
  if (!invitation) return null;

  // Validate: not revoked, not expired, under max_uses.
  if (invitation.revoked_at) return null;
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date())
    return null;
  if (
    invitation.max_uses !== null &&
    invitation.use_count >= invitation.max_uses
  )
    return null;

  const workspaceId = invitation.workspace_id as string;
  const role = invitation.role as string;

  // Check if already a member.
  const { data: existing } = await admin
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  // Fetch the workspace (for the return value).
  const { data: workspace } = await admin
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle();

  if (!workspace) return null;

  if (existing) return workspace as Workspace; // Already a member — no-op.

  // Add the user as a member with the invitation's role.
  const { error: insertError } = await admin
    .from("workspace_members")
    .insert({ workspace_id: workspaceId, user_id: userId, role });

  if (insertError) throw insertError;

  // Increment use_count and set last_used_at.
  await admin
    .from("workspace_invitations")
    .update({
      use_count: (invitation.use_count as number) + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", invitation.id as string);

  return workspace as Workspace;
}
