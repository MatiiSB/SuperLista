import { createClient } from "@/lib/supabase/server";
import type { ShoppingItem, ListItemInput } from "@/types/list";

/**
 * Data access for shopping items. RLS ensures only workspace members (or
 * guests via NFC) can access items.
 */

/** Get all items in a list, ordered by position then creation time. */
export async function getItems(listId: string): Promise<ShoppingItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shopping_items")
    .select("*")
    .eq("shopping_list_id", listId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ShoppingItem[];
}

/** Add a new item to a list. */
export async function addItem(
  listId: string,
  input: ListItemInput,
): Promise<ShoppingItem> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shopping_items")
    .insert({
      shopping_list_id: listId,
      custom_name: input.name,
      quantity: input.quantity,
      unit: input.unit,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as ShoppingItem;
}

/** Toggle the checked state of an item. */
export async function toggleItem(
  itemId: string,
  checked: boolean,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("shopping_items")
    .update({ checked })
    .eq("id", itemId);

  if (error) throw error;
}

/** Update an item's name, quantity, unit, or notes. */
export async function updateItem(
  itemId: string,
  patch: Partial<
    Pick<ShoppingItem, "custom_name" | "quantity" | "unit" | "notes">
  >,
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("shopping_items")
    .update(patch)
    .eq("id", itemId);

  if (error) throw error;
}

/** Delete a single item. */
export async function deleteItem(itemId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("shopping_items")
    .delete()
    .eq("id", itemId);

  if (error) throw error;
}

/** Remove all checked items from a list. */
export async function clearCheckedItems(listId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("shopping_items")
    .delete()
    .eq("shopping_list_id", listId)
    .eq("checked", true);

  if (error) throw error;
}
