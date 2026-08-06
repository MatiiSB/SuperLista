import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server-admin";
import type { WorkspaceMember, WorkspaceRole } from "@/types/workspace";

/**
 * Data access for workspace membership. RLS ensures only members can read
 * and only owners can manage.
 */

/** Get all members of a workspace, enriched with profile display fields. */
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
  const members = (data ?? []) as WorkspaceMember[];
  if (members.length === 0) return members;

  // Profiles are RLS-locked to self (auth.uid() = id), so the regular client
  // can only read the current user's own profile. Use the admin client to
  // enrich the other members' display fields. The membership read above stays
  // RLS-gated — only members reach this point.
  const userIds = members.map((m) => m.user_id);
  const admin = createAdminClient();
  const { data: profiles, error: profileError } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .in("id", userIds);

  if (profileError) throw profileError;

  const profileById = new Map(
    (profiles ?? []).map((p) => [p.id as string, p]),
  );
  return members.map((m) => {
    const profile = profileById.get(m.user_id);
    return {
      ...m,
      email: profile?.email ?? null,
      full_name: profile?.full_name ?? null,
    };
  });
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
