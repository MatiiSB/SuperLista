import { createAdminClient } from "@/lib/supabase/server-admin";
import type { ShoppingItem, ListItemInput } from "@/types/list";

/**
 * Guest write operations for shopping items. Uses the admin client (bypasses
 * RLS) because guests have no Supabase Auth session.
 *
 * IMPORTANT: the caller (server action) MUST verify that the target list/item
 * belongs to the guest's scoped list before calling these functions.
 */

/** Look up which list an item belongs to (for scope validation). */
export async function getItemListId(itemId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("shopping_items")
    .select("shopping_list_id")
    .eq("id", itemId)
    .maybeSingle();

  if (error) throw error;
  return (data?.shopping_list_id as string) ?? null;
}

export async function guestAddItem(
  listId: string,
  input: ListItemInput,
): Promise<ShoppingItem> {
  const admin = createAdminClient();
  const { data, error } = await admin
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

export async function guestToggleItem(
  itemId: string,
  checked: boolean,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("shopping_items")
    .update({ checked })
    .eq("id", itemId);

  if (error) throw error;
}

export async function guestUpdateItem(
  itemId: string,
  patch: Partial<
    Pick<ShoppingItem, "custom_name" | "quantity" | "unit" | "notes">
  >,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("shopping_items")
    .update(patch)
    .eq("id", itemId);

  if (error) throw error;
}

export async function guestDeleteItem(itemId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("shopping_items").delete().eq("id", itemId);
  if (error) throw error;
}

export async function guestClearChecked(listId: string): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("shopping_items")
    .delete()
    .eq("shopping_list_id", listId)
    .eq("checked", true);

  if (error) throw error;
}
