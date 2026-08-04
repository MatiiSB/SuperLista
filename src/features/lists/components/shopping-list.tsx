"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { Eraser, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  addItemAction,
  clearCheckedAction,
  deleteItemAction,
  toggleItemAction,
} from "@/features/lists/actions";
import { useShoppingItems } from "@/hooks/use-shopping-items";
import { useListPreferences } from "@/store/list-preferences";
import type { ShoppingItem, ShoppingList, ListItemInput } from "@/types/list";
import { ListItemRow } from "./list-item-row";
import { AddItemForm } from "./add-item-form";
import { EmptyState } from "./empty-state";

// ── Optimistic reducer ──────────────────────────────────────────────────────

type OptimisticAction =
  | { type: "add"; item: ShoppingItem }
  | { type: "toggle"; itemId: string; checked: boolean }
  | { type: "delete"; itemId: string }
  | { type: "clearChecked" };

function itemsReducer(
  state: ShoppingItem[],
  action: OptimisticAction,
): ShoppingItem[] {
  switch (action.type) {
    case "add":
      return [...state, action.item];
    case "toggle":
      return state.map((item) =>
        item.id === action.itemId ? { ...item, checked: action.checked } : item,
      );
    case "delete":
      return state.filter((item) => item.id !== action.itemId);
    case "clearChecked":
      return state.filter((item) => !item.checked);
  }
}

// ── Component ───────────────────────────────────────────────────────────────

export function ShoppingList({
  list,
  items: initialItems,
  guestMode = false,
  guestJwt,
}: {
  list: ShoppingList;
  items: ShoppingItem[];
  guestMode?: boolean;
  guestJwt?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [baseItems, setBaseItems] = useShoppingItems(
    list.id,
    initialItems,
    guestJwt,
  );
  const [optimisticItems, updateOptimistic] = useOptimistic(
    baseItems,
    (state, action: OptimisticAction) => itemsReducer(state, action),
  );

  const { hideChecked, sortCheckedBottom, toggleHideChecked } =
    useListPreferences();

  const checkedCount = optimisticItems.filter((i) => i.checked).length;

  // Apply preferences: filter and sort.
  const visibleItems = optimisticItems
    .filter((item) => !hideChecked || !item.checked)
    .toSorted((a, b) => {
      if (!sortCheckedBottom) return 0;
      return Number(a.checked) - Number(b.checked);
    });

  // ── Mutation handlers ─────────────────────────────────────────────────────

  function handleAdd(input: ListItemInput) {
    const tempId = crypto.randomUUID();
    const tempItem: ShoppingItem = {
      id: tempId,
      shopping_list_id: list.id,
      product_id: null,
      custom_name: input.name,
      quantity: input.quantity,
      unit: input.unit,
      checked: false,
      checked_at: null,
      notes: null,
      barcode: null,
      position: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    startTransition(async () => {
      updateOptimistic({ type: "add", item: tempItem });
      const result = await addItemAction(list.id, input);
      if (result.ok) {
        // Replace temp item with the real item from the DB.
        const realItem = result.data;
        setBaseItems((prev) => {
          const filtered = prev.filter(
            (i) => i.id !== tempId && i.id !== realItem.id,
          );
          return [...filtered, realItem];
        });
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleToggle(itemId: string, checked: boolean) {
    startTransition(async () => {
      updateOptimistic({ type: "toggle", itemId, checked });
      const result = await toggleItemAction(itemId, checked);
      if (result.ok) {
        setBaseItems((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  checked,
                  checked_at: checked ? new Date().toISOString() : null,
                }
              : i,
          ),
        );
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete(itemId: string) {
    startTransition(async () => {
      updateOptimistic({ type: "delete", itemId });
      const result = await deleteItemAction(itemId);
      if (result.ok) {
        setBaseItems((prev) => prev.filter((i) => i.id !== itemId));
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleClearChecked() {
    startTransition(async () => {
      updateOptimistic({ type: "clearChecked" });
      const result = await clearCheckedAction(list.id);
      if (result.ok) {
        setBaseItems((prev) => prev.filter((i) => !i.checked));
      } else {
        toast.error(result.error);
      }
    });
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-4 px-4 py-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold tracking-tight">{list.name}</h1>
          <p className="text-muted-foreground text-xs">
            {optimisticItems.length}{" "}
            {optimisticItems.length === 1 ? "producto" : "productos"}
            {checkedCount > 0 &&
              ` · ${checkedCount} tachado${checkedCount === 1 ? "" : "s"}`}
            {guestMode && " · invitado"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleHideChecked}
            aria-label={hideChecked ? "Mostrar tachados" : "Ocultar tachados"}
            aria-pressed={hideChecked}
          >
            {hideChecked ? <Eye /> : <EyeOff />}
          </Button>
          {checkedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChecked}
              disabled={isPending}
            >
              <Eraser className="size-3.5" />
              Limpiar
            </Button>
          )}
        </div>
      </header>

      {/* Items */}
      <div className="flex flex-1 flex-col">
        {visibleItems.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="flex flex-col divide-y">
            {visibleItems.map((item) => (
              <li key={item.id}>
                <ListItemRow
                  item={item}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add form */}
      <AddItemForm onAdd={handleAdd} disabled={isPending} />
    </main>
  );
}
