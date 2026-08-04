import { createClient } from "@/lib/supabase/server";
import type { ShoppingList } from "@/types/list";

/**
 * Data access for shopping lists within workspaces.
 */

/** Get all lists in a workspace. */
export async function getListsInWorkspace(
  workspaceId: string,
): Promise<ShoppingList[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shopping_lists")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ShoppingList[];
}

/** Get a single list by ID. */
export async function getList(listId: string): Promise<ShoppingList | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shopping_lists")
    .select("*")
    .eq("id", listId)
    .maybeSingle();

  if (error) throw error;
  return data as ShoppingList | null;
}

/** Get the default list in a workspace, or the first list, or create one. */
export async function getOrCreateDefaultList(
  workspaceId: string,
): Promise<ShoppingList> {
  const supabase = await createClient();

  // Try to find the default list.
  const { data: existing } = await supabase
    .from("shopping_lists")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing) return existing as ShoppingList;

  // Create a new default list.
  const { data: created, error } = await supabase
    .from("shopping_lists")
    .insert({ workspace_id: workspaceId, name: "Lista", is_default: true })
    .select("*")
    .single();

  if (error) throw error;
  return created as ShoppingList;
}

/** Create a new list in a workspace. */
export async function createList(
  workspaceId: string,
  name: string,
): Promise<ShoppingList> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shopping_lists")
    .insert({ workspace_id: workspaceId, name })
    .select("*")
    .single();

  if (error) throw error;
  return data as ShoppingList;
}

/** Update a list's name, icon, or color. */
export async function updateList(
  listId: string,
  patch: Partial<Pick<ShoppingList, "name" | "icon" | "color">>,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("shopping_lists")
    .update(patch)
    .eq("id", listId);

  if (error) throw error;
}

/** Delete a list. Only workspace owners can do this (enforced by RLS). */
export async function deleteList(listId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("shopping_lists")
    .delete()
    .eq("id", listId);

  if (error) throw error;
}
