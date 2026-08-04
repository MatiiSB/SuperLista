/**
 * Domain types for the shopping list feature (workspace-centric model).
 */

export interface ShoppingList {
  id: string;
  workspace_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShoppingItem {
  id: string;
  shopping_list_id: string;
  product_id: string | null;
  custom_name: string;
  quantity: number;
  unit: string | null;
  checked: boolean;
  checked_at: string | null;
  notes: string | null;
  barcode: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

// ── Input / result types ────────────────────────────────────────────────────

/** Fields the client provides when creating an item. */
export type ListItemInput = {
  name: string;
  quantity: number;
  unit: string | null;
};

/** Result envelope for server actions. */
export type ActionResult = { ok: true } | { ok: false; error: string };

/** Result with data payload. */
export type ActionResultWithData<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
