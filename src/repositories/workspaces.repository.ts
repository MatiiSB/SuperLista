import { createClient } from "@/lib/supabase/server";
import type { Workspace, WorkspaceSummary } from "@/types/workspace";

/**
 * Data access for workspaces. RLS ensures users only see workspaces they
 * belong to.
 */

/** Get all workspaces the user is a member of, with role and counts. */
export async function getUserWorkspaces(
  userId: string,
): Promise<WorkspaceSummary[]> {
  const supabase = await createClient();

  // Get the user's memberships.
  const { data: memberships, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("user_id", userId)
    .order("joined_at", { ascending: true });

  if (error) throw error;
  if (!memberships || memberships.length === 0) return [];

  const workspaceIds = memberships.map((m) => m.workspace_id);

  // Fetch workspaces, member counts, and list counts in parallel.
  const [workspaces, memberCounts, listCounts] = await Promise.all([
    fetchWorkspaces(workspaceIds),
    countMembers(workspaceIds),
    countLists(workspaceIds),
  ]);

  const wsMap = new Map(workspaces.map((w) => [w.id, w]));

  return memberships
    .filter((m) => wsMap.has(m.workspace_id))
    .map((m) => {
      const ws = wsMap.get(m.workspace_id)!;
      return {
        id: ws.id,
        name: ws.name,
        image_url: ws.image_url,
        role: m.role as WorkspaceSummary["role"],
        member_count: memberCounts[ws.id] ?? 0,
        list_count: listCounts[ws.id] ?? 0,
      };
    });
}

async function fetchWorkspaces(
  workspaceIds: string[],
): Promise<Pick<Workspace, "id" | "name" | "image_url">[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("id, name, image_url")
    .in("id", workspaceIds);

  if (error) throw error;
  return (data ?? []) as Pick<Workspace, "id" | "name" | "image_url">[];
}

async function countMembers(
  workspaceIds: string[],
): Promise<Record<string, number>> {
  if (workspaceIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .in("workspace_id", workspaceIds);

  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.workspace_id] = (counts[row.workspace_id] ?? 0) + 1;
  }
  return counts;
}

async function countLists(
  workspaceIds: string[],
): Promise<Record<string, number>> {
  if (workspaceIds.length === 0) return {};
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shopping_lists")
    .select("workspace_id")
    .in("workspace_id", workspaceIds);

  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.workspace_id] = (counts[row.workspace_id] ?? 0) + 1;
  }
  return counts;
}

/** Get a single workspace by ID. */
export async function getWorkspace(
  workspaceId: string,
): Promise<Workspace | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle();

  if (error) throw error;
  return data as Workspace | null;
}
