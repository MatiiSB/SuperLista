"use server";

import { refresh } from "next/cache";
import type {
  ActionResult,
  ActionResultWithData,
  ListItemInput,
  ShoppingItem,
  ShoppingList,
} from "@/types/list";
import { getRequestContext } from "@/lib/auth/request-context";
import type { RequestContext } from "@/lib/auth/request-context";
import { recordAudit, type AuditActorType } from "@/services/audit.service";
import {
  addItem,
  clearCheckedItems,
  deleteItem,
  toggleItem,
  updateItem,
} from "@/repositories/shopping-items.repository";
import {
  createList,
  deleteList,
  updateList,
} from "@/repositories/shopping-lists.repository";
import { upsertProductCategory } from "@/repositories/product-categories.repository";
import { normalizeName } from "@/features/lists/categories";
import {
  guestAddItem,
  guestClearChecked,
  guestDeleteItem,
  guestToggleItem,
  guestUpdateItem,
  getItemListId,
} from "@/services/guest-shopping.service";

// ── Item actions (available to members AND guests via NFC) ──────────────────
// No refresh() — realtime + direct state update handle the UI.

/** Derive the audit actor from the request context. */
function auditActor(ctx: RequestContext): {
  actorType: AuditActorType;
  actorId: string | null;
} {
  if (ctx.kind === "user") return { actorType: "user", actorId: ctx.userId };
  return { actorType: "guest", actorId: null };
}

export async function addItemAction(
  listId: string,
  input: ListItemInput,
): Promise<ActionResultWithData<ShoppingItem>> {
  const ctx = await getRequestContext();

  try {
    if (ctx.kind === "user") {
      const item = await addItem(listId, input);
      recordAudit({
        ...auditActor(ctx),
        action: "item.add",
        entityType: "shopping_item",
        entityId: item.id,
        metadata: { shopping_list_id: listId, name: input.name },
      });
      return { ok: true, data: item };
    }
    if (ctx.kind === "guest") {
      if (listId !== ctx.listId) return { ok: false, error: "No autorizado" };
      const item = await guestAddItem(listId, input);
      recordAudit({
        ...auditActor(ctx),
        action: "item.add",
        entityType: "shopping_item",
        entityId: item.id,
        metadata: { shopping_list_id: listId, name: input.name },
      });
      return { ok: true, data: item };
    }
    return { ok: false, error: "No autenticado" };
  } catch {
    return { ok: false, error: "No se pudo agregar el item" };
  }
}

export async function toggleItemAction(
  itemId: string,
  checked: boolean,
): Promise<ActionResult> {
  const ctx = await getRequestContext();

  try {
    if (ctx.kind === "user") {
      await toggleItem(itemId, checked);
      recordAudit({
        ...auditActor(ctx),
        action: "item.toggle",
        entityType: "shopping_item",
        entityId: itemId,
        metadata: { checked },
      });
      return { ok: true };
    }
    if (ctx.kind === "guest") {
      const itemListId = await getItemListId(itemId);
      if (!itemListId || itemListId !== ctx.listId)
        return { ok: false, error: "No autorizado" };
      await guestToggleItem(itemId, checked);
      recordAudit({
        ...auditActor(ctx),
        action: "item.toggle",
        entityType: "shopping_item",
        entityId: itemId,
        metadata: { checked },
      });
      return { ok: true };
    }
    return { ok: false, error: "No autenticado" };
  } catch {
    return { ok: false, error: "No se pudo actualizar el item" };
  }
}

export async function updateItemAction(
  itemId: string,
  patch: Partial<Pick<ShoppingItem, "custom_name" | "quantity" | "unit" | "notes">>,
): Promise<ActionResult> {
  const ctx = await getRequestContext();

  try {
    if (ctx.kind === "user") {
      await updateItem(itemId, patch);
      recordAudit({
        ...auditActor(ctx),
        action: "item.update",
        entityType: "shopping_item",
        entityId: itemId,
        metadata: { patch },
      });
      return { ok: true };
    }
    if (ctx.kind === "guest") {
      const itemListId = await getItemListId(itemId);
      if (!itemListId || itemListId !== ctx.listId)
        return { ok: false, error: "No autorizado" };
      await guestUpdateItem(itemId, patch);
      recordAudit({
        ...auditActor(ctx),
        action: "item.update",
        entityType: "shopping_item",
        entityId: itemId,
        metadata: { patch },
      });
      return { ok: true };
    }
    return { ok: false, error: "No autenticado" };
  } catch {
    return { ok: false, error: "No se pudo actualizar el item" };
  }
}

export async function deleteItemAction(itemId: string): Promise<ActionResult> {
  const ctx = await getRequestContext();

  try {
    if (ctx.kind === "user") {
      await deleteItem(itemId);
      recordAudit({
        ...auditActor(ctx),
        action: "item.delete",
        entityType: "shopping_item",
        entityId: itemId,
      });
      return { ok: true };
    }
    if (ctx.kind === "guest") {
      const itemListId = await getItemListId(itemId);
      if (!itemListId || itemListId !== ctx.listId)
        return { ok: false, error: "No autorizado" };
      await guestDeleteItem(itemId);
      recordAudit({
        ...auditActor(ctx),
        action: "item.delete",
        entityType: "shopping_item",
        entityId: itemId,
      });
      return { ok: true };
    }
    return { ok: false, error: "No autenticado" };
  } catch {
    return { ok: false, error: "No se pudo eliminar el item" };
  }
}

export async function clearCheckedAction(
  listId: string,
): Promise<ActionResult> {
  const ctx = await getRequestContext();

  try {
    if (ctx.kind === "user") {
      await clearCheckedItems(listId);
      recordAudit({
        ...auditActor(ctx),
        action: "items.clear_checked",
        entityType: "shopping_list",
        entityId: listId,
      });
      return { ok: true };
    }
    if (ctx.kind === "guest") {
      if (listId !== ctx.listId) return { ok: false, error: "No autorizado" };
      await guestClearChecked(listId);
      recordAudit({
        ...auditActor(ctx),
        action: "items.clear_checked",
        entityType: "shopping_list",
        entityId: listId,
      });
      return { ok: true };
    }
    return { ok: false, error: "No autenticado" };
  } catch {
    return { ok: false, error: "No se pudieron limpiar los items" };
  }
}

// ── List management actions (authenticated members only) ────────────────────
// Guests cannot create/update/delete lists. These use refresh() since the
// list-of-lists view needs to update.

export async function createListAction(
  workspaceId: string,
  name: string,
): Promise<ActionResultWithData<ShoppingList>> {
  const ctx = await getRequestContext();
  if (ctx.kind !== "user") return { ok: false, error: "No autenticado" };

  try {
    const list = await createList(workspaceId, name);
    recordAudit({
      ...auditActor(ctx),
      workspaceId,
      action: "list.create",
      entityType: "shopping_list",
      entityId: list.id,
      metadata: { name },
    });
    refresh();
    return { ok: true, data: list };
  } catch {
    return { ok: false, error: "No se pudo crear la lista" };
  }
}

export async function updateListAction(
  listId: string,
  patch: Partial<Pick<ShoppingList, "name" | "icon" | "color">>,
): Promise<ActionResult> {
  const ctx = await getRequestContext();
  if (ctx.kind !== "user") return { ok: false, error: "No autenticado" };

  try {
    await updateList(listId, patch);
    refresh();
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo actualizar la lista" };
  }
}

export async function deleteListAction(listId: string): Promise<ActionResult> {
  const ctx = await getRequestContext();
  if (ctx.kind !== "user") return { ok: false, error: "No autenticado" };

  try {
    await deleteList(listId);
    recordAudit({
      ...auditActor(ctx),
      action: "list.delete",
      entityType: "shopping_list",
      entityId: listId,
    });
    refresh();
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo eliminar la lista" };
  }
}

/** Set the learned category for a product name (authenticated users only). */
export async function setProductCategoryAction(
  workspaceId: string,
  name: string,
  categorySlug: string,
): Promise<ActionResult> {
  const ctx = await getRequestContext();
  if (ctx.kind !== "user") return { ok: false, error: "No autenticado" };

  const normalized = normalizeName(name);
  if (!normalized) return { ok: false, error: "Nombre inválido" };

  try {
    await upsertProductCategory(workspaceId, normalized, categorySlug);
    recordAudit({
      ...auditActor(ctx),
      workspaceId,
      action: "product.categorize",
      entityType: "product_categories",
      metadata: { name: normalized, category: categorySlug },
    });
    refresh();
    return { ok: true };
  } catch {
    return { ok: false, error: "No se pudo guardar la categoría" };
  }
}
