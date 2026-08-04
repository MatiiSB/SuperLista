/**
 * NFC tag domain types.
 */

export interface NfcTag {
  id: string;
  workspace_id: string;
  shopping_list_id: string;
  name: string;
  secret_token: string;
  enabled: boolean;
  last_used_at: string | null;
  created_at: string;
}

/** Resolved NFC tag with the associated list (for the /nfc/[token] route). */
export interface ResolvedNfcTag {
  tag: NfcTag;
  list: import("@/types/list").ShoppingList;
}
