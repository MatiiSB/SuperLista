import { createClient } from "@/lib/supabase/server";
import type { WorkspaceMember, WorkspaceRole } from "@/types/workspace";

/**
 * Data access for workspace membership. RLS ensures only members can read
 * and only owners can manage.
 */

/** Get all members of a workspace. */
export async function getMembers(
  workspaceId: string,
): Promise<WorkspaceMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("joined_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as WorkspaceMember[];
}

/** Get the user's role in a workspace, or null if not a member. */
export async function getUserRole(
  workspaceId: string,
  userId: string,
): Promise<WorkspaceRole | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data?.role as WorkspaceRole) ?? null;
}

/** Update a member's role. Only the owner can do this (enforced by RLS). */
export async function updateMemberRole(
  workspaceId: string,
  userId: string,
  role: WorkspaceRole,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("workspace_members")
    .update({ role })
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);

  if (error) throw error;
}

/** Remove a member. Only the owner can do this (enforced by RLS). */
export async function removeMember(
  workspaceId: string,
  userId: string,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);

  if (error) throw error;
}
