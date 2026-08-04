import { createAdminClient } from "@/lib/supabase/server-admin";
import type { ShoppingList } from "@/types/list";
import type { NfcTag, ResolvedNfcTag } from "@/types/nfc";

/**
 * NFC tag resolution. Uses the admin client because the caller may be an
 * unauthenticated guest — RLS would block the query.
 */

/**
 * Resolve an NFC tag by its secret token. Updates `last_used_at` and returns
 * the tag with its associated shopping list.
 *
 * Returns null if the token doesn't exist or the tag is disabled.
 */
export async function resolveNfcTag(
  token: string,
): Promise<ResolvedNfcTag | null> {
  const admin = createAdminClient();

  // Look up the tag.
  const { data: tag, error } = await admin
    .from("nfc_tags")
    .select("*")
    .eq("secret_token", token)
    .eq("enabled", true)
    .maybeSingle();

  if (error) throw error;
  if (!tag) return null;

  const nfcTag = tag as NfcTag;

  // Update last_used_at (fire-and-forget, don't block the response).
  admin
    .from("nfc_tags")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", nfcTag.id)
    .then(() => {});

  // Fetch the associated shopping list.
  const { data: list, error: listError } = await admin
    .from("shopping_lists")
    .select("*")
    .eq("id", nfcTag.shopping_list_id)
    .maybeSingle();

  if (listError) throw listError;
  if (!list) return null;

  return {
    tag: nfcTag,
    list: list as ShoppingList,
  };
}

/** Fetch shopping items for a list using the admin client (for guest access). */
export async function getItemsForGuest(
  listId: string,
): Promise<import("@/types/list").ShoppingItem[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("shopping_items")
    .select("*")
    .eq("shopping_list_id", listId)
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as import("@/types/list").ShoppingItem[];
}
